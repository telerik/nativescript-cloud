import * as path from "path";
import * as semver from "semver";
import * as uuid from "uuid";
import { EOL } from "os";
import * as constants from "../constants";
import * as forge from "node-forge";
import * as minimatch from "minimatch";
const plist = require("simple-plist");

interface IAmazonStorageEntryData extends CloudService.AmazonStorageEntry {
	fileNameInS3: string;
}

export class CloudBuildService implements ICloudBuildService {

	constructor(private $fs: IFileSystem,
		private $httpClient: Server.IHttpClient,
		private $errors: IErrors,
		private $server: CloudService.IServer,
		private $qr: IQrCodeGenerator,
		private $mobileHelper: Mobile.IMobileHelper,
		private $projectHelper: IProjectHelper,
		private $logger: ILogger) { }

	public async build(projectSettings: IProjectSettings,
		platform: string, buildConfiguration: string,
		androidBuildData?: IAndroidBuildData,
		iOSBuildData?: IIOSBuildData): Promise<IBuildResultData> {

		const buildInformationString = `cloud build of '${projectSettings.projectDir}', platform: '${platform}', configuration: '${buildConfiguration}' `;
		this.$logger.info(`Starting ${buildInformationString}.`);

		await this.validateBuildProperties(platform, buildConfiguration, projectSettings.projectId, androidBuildData, iOSBuildData);
		let buildProps = await this.prepareBuildRequest(projectSettings, platform, buildConfiguration);

		if (this.$mobileHelper.isAndroidPlatform(platform)) {
			buildProps = await this.getAndroidBuildProperties(projectSettings, buildProps, androidBuildData);
		} else if (this.$mobileHelper.isiOSPlatform(platform)) {
			buildProps = await this.getiOSBuildProperties(projectSettings, buildProps, iOSBuildData);
		}

		const buildResult: any = await this.$server.appsBuild.buildProject(projectSettings.projectId, buildProps);

		if (!buildResult.BuildItems || !buildResult.BuildItems.length) {
			// Something failed
			// Fail with combination of Errors and Output:
			this.$errors.failWithoutHelp(`Build failed. Reason is: ${buildResult.Errors}. Additional information: ${buildResult.Output}.`);
		}

		this.$logger.info(`Finished ${buildInformationString} successfully. Downloading result...`);

		const localBuildResult = await this.downloadBuildResult(buildResult, projectSettings.projectDir);

		this.$logger.info(`The result of ${buildInformationString} successfully downloaded. Log from cloud build is:${EOL}* stderr: ${buildResult.Errors}${EOL}* stdout: ${buildResult.Output}${EOL}* outputFilePath: ${localBuildResult}`);

		const buildResultUrl = this.getBuildResultUrl(buildResult);

		return {
			stderr: buildResult.Errors,
			stdout: buildResult.Output,
			fullOutput: buildResult.FullOutput,
			outputFilePath: localBuildResult,
			qrData: {
				originalUrl: buildResultUrl,
				imageData: await this.$qr.generateDataUri(buildResultUrl)
			}
		};
	}

	public async validateBuildProperties(platform: string,
		buildConfiguration: string,
		appId: string,
		androidBuildData?: IAndroidBuildData,
		iOSBuildData?: IIOSBuildData): Promise<void> {
		if (this.$mobileHelper.isAndroidPlatform(platform) && this.isReleaseConfiguration(buildConfiguration)) {
			if (!androidBuildData || !androidBuildData.pathToCertificate) {
				this.$errors.failWithoutHelp("When building for Release configuration, you must specify valid Certificate and its password.");
			}

			if (!this.$fs.exists(androidBuildData.pathToCertificate)) {
				this.$errors.failWithoutHelp(`The specified certificate: ${androidBuildData.pathToCertificate} does not exist. Verify the location is correct.`);
			}

			if (!androidBuildData.certificatePassword) {
				this.$errors.failWithoutHelp(`No password specified for certificate ${androidBuildData.pathToCertificate}.`);
			}

			if (androidBuildData.certificatePassword.length < 6) {
				this.$errors.failWithoutHelp("The password for Android certificate must be at least 6 characters long.");
			}
		} else if (this.$mobileHelper.isiOSPlatform(platform) && iOSBuildData.buildForDevice) {
			if (!iOSBuildData || !iOSBuildData.pathToCertificate || !iOSBuildData.certificatePassword || !iOSBuildData.pathToProvision) {
				this.$errors.failWithoutHelp("When building for iOS you must specify valid Mobile Provision, Certificate and its password.");
			}

			if (!this.$fs.exists(iOSBuildData.pathToCertificate)) {
				this.$errors.failWithoutHelp(`The specified certificate: ${iOSBuildData.pathToCertificate} does not exist. Verify the location is correct.`);
			}

			if (!this.$fs.exists(iOSBuildData.pathToProvision)) {
				this.$errors.failWithoutHelp(`The specified provision: ${iOSBuildData.pathToProvision} does not exist. Verify the location is correct.`);
			}

			const certInfo = this.getCertificateInfo(iOSBuildData.pathToCertificate, iOSBuildData.certificatePassword);
			const certBase64 = this.getCertificateBase64(certInfo.pemCert);
			const provisionData = this.getMobileProvisionData(iOSBuildData.pathToProvision);
			const provisionCertificatesBase64 = _.map(provisionData.DeveloperCertificates, c => c.toString('base64'));
			const now = Date.now();

			let provisionAppId = provisionData.Entitlements['application-identifier'];
			_.each(provisionData.ApplicationIdentifierPrefix, prefix => {
				provisionAppId = provisionAppId.replace(`${prefix}.`, "");
			});

			let errors: string[] = [];

			if (provisionAppId !== "*") {
				let provisionIdentifierPattern = new RegExp(this.getRegexPattern(provisionAppId));
				if (!provisionIdentifierPattern.test(appId)) {
					errors.push(`The specified provision's (${iOSBuildData.pathToProvision}) application identifier (${provisionAppId}) doesn't match your project's application identifier (${appId}).`);
				}
			}

			if (certInfo.organization !== constants.APPLE_INC) {
				errors.push(`The specified certificate: ${iOSBuildData.pathToCertificate} is issued by an untrusted organization. Please provide a certificate issued by ${constants.APPLE_INC}`);
			}

			if (now > provisionData.ExpirationDate.getTime()) {
				errors.push(`The specified provision: ${iOSBuildData.pathToProvision} has expired.`);
			}

			if (now < certInfo.validity.notBefore.getTime() || now > certInfo.validity.notAfter.getTime()) {
				errors.push(`The specified certificate: ${iOSBuildData.pathToCertificate} has expired.`);
			}

			if (!_.includes(provisionCertificatesBase64, certBase64)) {
				errors.push(`The specified provision: ${iOSBuildData.pathToProvision} does not include the specified certificate: ${iOSBuildData.pathToCertificate}. Please specify a different provision or certificate.`);
			}

			if (iOSBuildData.deviceIdentifier && !_.includes(provisionData.ProvisionedDevices, iOSBuildData.deviceIdentifier)) {
				errors.push(`The specified provision: ${iOSBuildData.pathToProvision} does not include the specified device: ${iOSBuildData.deviceIdentifier}.`);
			}

			if (errors.length) {
				this.$errors.failWithoutHelp(errors.join(EOL));
			}
		}
	}

	private async prepareBuildRequest(projectSettings: { projectDir: string, projectId: string, projectName: string, nativescriptData: any },
		platform: string, buildConfiguration: string): Promise<any> {

		const projectZipFile = await this.zipProject(projectSettings.projectDir);
		const buildPreSignedUrlData = await this.uploadFileToS3(projectSettings.projectId, projectZipFile);

		// HACK just for this version. After that we'll have UI for getting runtime version.
		// Until then, use the coreModulesVersion.
		const coreModulesVersion = this.$fs.readJson(path.join(projectSettings.projectDir, "package.json")).dependencies["tns-core-modules"];
		const runtimeVersion = this.getRuntimeVersion(platform, projectSettings.nativescriptData, coreModulesVersion);
		const cliVersion = await this.getCliVersion(runtimeVersion);
		const sanitizedProjectName = this.$projectHelper.sanitizeName(projectSettings.projectName);

		return {
			Properties: {
				ProjectConfiguration: buildConfiguration,
				BuildConfiguration: buildConfiguration,
				Platform: platform,
				AppIdentifier: projectSettings.projectId,
				FrameworkVersion: cliVersion,
				RuntimeVersion: runtimeVersion,
				AcceptResults: "Url;LocalPath",
				SessionKey: buildPreSignedUrlData.SessionKey,
				TemplateAppName: sanitizedProjectName,
				ProjectName: sanitizedProjectName,
				Framework: "tns"
			},
			BuildFiles: [
				{
					disposition: "PackageZip",
					sourceUri: buildPreSignedUrlData.S3Url
				}
			],
			Target: []
		};

	}

	private async uploadFileToS3(projectId: string, localFilePath: string, fileNameInS3?: string): Promise<IAmazonStorageEntryData> {
		fileNameInS3 = fileNameInS3 || uuid.v4();
		const preSignedUrlData = await this.$server.appsBuild.getPresignedUploadUrlObject(projectId, fileNameInS3);

		const requestOpts: any = {
			url: preSignedUrlData.UploadPreSignedUrl,
			method: "PUT"
		};

		requestOpts.body = this.$fs.readFile(localFilePath);
		requestOpts.headers = requestOpts.headers || {};
		// It is vital we set this, else the http request comes out as chunked and S3 doesn't support chunked requests
		requestOpts.headers["Content-Length"] = requestOpts.body.length;

		try {
			await this.$httpClient.httpRequest(requestOpts);
		} catch (err) {
			this.$errors.failWithoutHelp(`Error while uploading ${localFilePath} to S3. Errors is:`, err.message);
		}

		const amazonStorageEntryData: IAmazonStorageEntryData = _.merge({ fileNameInS3 }, preSignedUrlData, );

		return amazonStorageEntryData;
	}

	private getCertificateBase64(cert: string) {
		return cert.replace(/\s/g, "").substr(constants.CRYPTO.CERTIFICATE_HEADER.length).slice(0, -constants.CRYPTO.CERTIFICATE_FOOTER.length);
	}

	private async getAndroidBuildProperties(projectSettings: IProjectSettings,
		buildProps: any,
		androidBuildData?: IAndroidBuildData): Promise<any> {

		const buildConfiguration = buildProps.Properties.BuildConfiguration;

		if (this.isReleaseConfiguration(buildConfiguration)) {
			const certificateS3Data = await this.uploadFileToS3(projectSettings.projectId, androidBuildData.pathToCertificate);

			buildProps.Properties.keyStoreName = certificateS3Data.fileNameInS3;
			buildProps.Properties.keyStoreAlias = this.getCertificateInfo(androidBuildData.pathToCertificate, androidBuildData.certificatePassword).friendlyName;
			buildProps.Properties.keyStorePassword = androidBuildData.certificatePassword;
			buildProps.Properties.keyStoreAliasPassword = androidBuildData.certificatePassword;

			buildProps.BuildFiles.push({
				disposition: "CryptoStore",
				sourceUri: certificateS3Data.S3Url
			});
		}

		return buildProps;
	}

	private async getiOSBuildProperties(projectSettings: IProjectSettings,
		buildProps: any,
		iOSBuildData: IIOSBuildData): Promise<any> {

		if (iOSBuildData.buildForDevice) {
			const provisionData = this.getMobileProvisionData(iOSBuildData.pathToProvision);
			const certificateS3Data = await this.uploadFileToS3(projectSettings.projectId, iOSBuildData.pathToCertificate);
			const provisonS3Data = await this.uploadFileToS3(projectSettings.projectId, iOSBuildData.pathToProvision, `${provisionData.UUID}.mobileprovision`);

			buildProps.BuildFiles.push(
				{
					sourceUri: certificateS3Data.S3Url,
					disposition: "Keychain"
				},
				{
					sourceUri: provisonS3Data.S3Url,
					disposition: "Provision"
				}
			);

			buildProps.Properties.CertificatePassword = iOSBuildData.certificatePassword;
			buildProps.Properties.CodeSigningIdentity = this.getCertificateInfo(iOSBuildData.pathToCertificate, iOSBuildData.certificatePassword).commonName;

			const cloudProvisionsData: any[] = [{
				SuffixId: "",
				TemplateName: "PROVISION_",
				Identifier: provisionData.UUID,
				IsDefault: true,
				FileName: `${provisonS3Data.fileNameInS3}`,
				AppGroups: [],
				ProvisionType: this.getProvisionType(provisionData),
				Name: provisionData.Name
			}];
			buildProps.Properties.MobileProvisionIdentifiers = JSON.stringify(cloudProvisionsData);
			buildProps.Properties.DefaultMobileProvisionIdentifier = provisionData.UUID;
		} else {
			buildProps.Properties.Simulator = true;
		}

		return buildProps;
	}

	private getProvisionType(provisionData: IMobileProvisionData): string {
		// TODO: Discuss whether this code should be moved to the Tooling
		let result = "";
		if (provisionData.Entitlements['get-task-allow']) {
			result = "Development";
		} else {
			result = "AdHoc";
		}

		if (!provisionData.ProvisionedDevices || !provisionData.ProvisionedDevices.length) {
			if (provisionData.ProvisionsAllDevices) {
				result = "Enterprise";
			} else {
				result = "App Store";
			}
		}

		return result;
	}

	private getBuildResultUrl(buildResult: any): string {
		return this.getBuildResult(buildResult).FullPath;
	}

	private getBuildResult(buildResult: any): any {
		return _.find(buildResult.BuildItems, (b: any) => b.Disposition === "BuildResult");
	}

	private async downloadBuildResult(buildResult: any, projectDir: string): Promise<string> {
		const destinationDir = path.join(projectDir, constants.CLOUD_TEMP_DIR_NAME);
		this.$fs.ensureDirectoryExists(destinationDir);

		const buildResultObj = this.getBuildResult(buildResult);
		const targetFileName = path.join(destinationDir, buildResultObj.Filename);
		const targetFile = this.$fs.createWriteStream(targetFileName);

		// Download the output file.
		await this.$httpClient.httpRequest({
			url: buildResultObj.FullPath,
			pipeTo: targetFile
		});

		return targetFileName;
	}

	private async zipProject(projectDir: string): Promise<string> {
		let tempDir = path.join(projectDir, constants.CLOUD_TEMP_DIR_NAME);
		this.$fs.ensureDirectoryExists(tempDir);

		let projectZipFile = path.join(tempDir, "Build.zip");
		this.$fs.deleteFile(projectZipFile);

		let files = this.getProjectFiles(projectDir, ["node_modules", "platforms", constants.CLOUD_TEMP_DIR_NAME, "**/.*"]);

		await this.$fs.zipFiles(projectZipFile, files,
			p => this.getProjectRelativePath(p, projectDir));

		return projectZipFile;
	}

	private getProjectFiles(projectFilesPath: string, excludedProjectDirsAndFiles?: string[], filter?: (filePath: string, stat: IFsStats) => boolean, opts?: any): string[] {
		const projectFiles = this.$fs.enumerateFilesInDirectorySync(projectFilesPath, (filePath, stat) => {
			const isFileExcluded = this.isFileExcluded(path.relative(projectFilesPath, filePath), excludedProjectDirsAndFiles);
			const isFileFiltered = filter ? filter(filePath, stat) : false;
			return !isFileExcluded && !isFileFiltered;
		}, opts);

		this.$logger.trace("getProjectFiles for cloud build: ", projectFiles);

		return projectFiles;
	}

	private isFileExcluded(filePath: string, excludedProjectDirsAndFiles?: string[]): boolean {
		return !!_.find(excludedProjectDirsAndFiles, (pattern) => minimatch(filePath, pattern, { nocase: true }));
	}

	private getProjectRelativePath(fullPath: string, projectDir: string): string {
		projectDir = path.join(projectDir, path.sep);
		if (!_.startsWith(fullPath, projectDir)) {
			throw new Error("File is not part of the project.");
		}

		return fullPath.substring(projectDir.length);
	}

	private getRuntimeVersion(platform: string, nativescriptData: any, coreModulesVersion: string): string {
		const runtimePackageName = `tns-${platform.toLowerCase()}`;
		let runtimeVersion = nativescriptData && nativescriptData[runtimePackageName] && nativescriptData[runtimePackageName].version;
		if (!runtimeVersion && coreModulesVersion && semver.valid(coreModulesVersion)) {
			// no runtime added. Let's find out which one we need based on the tns-core-modules.
			runtimeVersion = `${semver.major(coreModulesVersion)}.${semver.minor(coreModulesVersion)}.*`;
		}

		return runtimeVersion || "2.5.0";
	}

	private async getCliVersion(runtimeVersion: string): Promise<string> {
		try {
			const response = await this.$httpClient.httpRequest("http://registry.npmjs.org/nativescript");
			const versions = _.keys(JSON.parse(response.body).versions);
			return "2.5.0" || semver.maxSatisfying(versions, `~${runtimeVersion}`);
		} catch (err) {
			return `${semver.major(runtimeVersion)}.${semver.minor(runtimeVersion)}.0`;
		}
	}

	private getCertificateInfo(certificatePath: string, certificatePassword: string): ICertificateInfo {
		const certificateAbsolutePath = path.resolve(certificatePath);
		const certificateContents: any = this.$fs.readFile(certificateAbsolutePath, { encoding: 'binary' });
		const pkcs12Asn1 = forge.asn1.fromDer(certificateContents);
		const pkcs12 = forge.pkcs12.pkcs12FromAsn1(pkcs12Asn1, false, certificatePassword);

		for (let safeContens of pkcs12.safeContents) {
			for (let safeBag of safeContens.safeBags) {
				if (safeBag.attributes.localKeyId && safeBag.type === forge.pki.oids['certBag']) {
					let issuer = safeBag.cert.issuer.getField(constants.CRYPTO.ORGANIZATION_FIELD_NAME);
					return {
						pemCert: forge.pki.certificateToPem(safeBag.cert),
						organization: issuer && issuer.value,
						validity: safeBag.cert.validity,
						commonName: safeBag.cert.subject.getField(constants.CRYPTO.COMMON_NAME_FIELD_NAME).value,
						friendlyName: _.head<string>(safeBag.attributes.friendlyName)
					};
				}
			}
		}

		this.$errors.failWithoutHelp(`Could not read ${certificatePath}. Please make sure there is a certificate inside.`);
	}

	private getMobileProvisionData(provisionPath: string): IMobileProvisionData {
		const provisionText = this.$fs.readText(path.resolve(provisionPath));
		const provisionPlistText = provisionText.substring(provisionText.indexOf(constants.CRYPTO.PLIST_HEADER), provisionText.indexOf(constants.CRYPTO.PLIST_FOOTER) + constants.CRYPTO.PLIST_FOOTER.length);
		return plist.parse(provisionPlistText);
	}

	private isReleaseConfiguration(buildConfiguration: string): boolean {
		return buildConfiguration.toLowerCase() === constants.RELEASE_CONFIGURATION_NAME;
	}

	private getRegexPattern(appIdentifier: string): string {
		let starPlaceholder = "<!StarPlaceholder!>";
		let escapedIdentifier = this.escape(this.stringReplaceAll(appIdentifier, "*", starPlaceholder));
		let replacedIdentifier = this.stringReplaceAll(escapedIdentifier, starPlaceholder, ".*");
		return "^" + replacedIdentifier + "$";
	}

	private escape(s: string): string {
		return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
	}

	private stringReplaceAll(inputString: string, find: any, replace: string): string {
		return inputString.split(find).join(replace);
	}
}
$injector.register("cloudBuildService", CloudBuildService);
