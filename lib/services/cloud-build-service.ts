import * as path from "path";
import * as semver from "semver";
import * as uuid from "uuid";
import * as forge from "node-forge";
import * as minimatch from "minimatch";
import { escape } from "querystring";
import { EOL } from "os";
import { EventEmitter } from "events";
import * as constants from "../constants";
const plist = require("simple-plist");

export class CloudBuildService extends EventEmitter implements ICloudBuildService {
	private static BUILD_STATUS_CHECK_INTERVAL = 1500;
	private static BUILD_COMPLETE_STATUS = "Success";
	private static BUILD_IN_PROGRESS_STATUS = "Building";
	private static BUILD_FAILED_STATUS = "Failed";
	private static DEFAULT_VERSION = "3.0.0";

	constructor(private $buildCloudService: IBuildCloudService,
		private $errors: IErrors,
		private $fs: IFileSystem,
		private $itmsServicesPlistHelper: IItmsServicesPlistHelper,
		private $httpClient: Server.IHttpClient,
		private $logger: ILogger,
		private $platformService: IPlatformService,
		private $cloudBuildOutputFilter: ICloudBuildOutputFilter,
		private $mobileHelper: Mobile.IMobileHelper,
		private $projectHelper: IProjectHelper,
		private $projectDataService: IProjectDataService,
		private $qr: IQrCodeGenerator) {
		super();
	}

	public getBuildOutputDirectory(options: ICloudBuildOutputDirectoryOptions): string {
		let result = path.join(options.projectDir, constants.CLOUD_TEMP_DIR_NAME, options.platform.toLowerCase());
		if (this.$mobileHelper.isiOSPlatform(options.platform)) {
			result = path.join(result, options.emulator ? constants.CLOUD_BUILD_DIRECTORY_NAMES.EMULATOR : constants.CLOUD_BUILD_DIRECTORY_NAMES.DEVICE);
		}

		return result;
	}

	public async build(projectSettings: IProjectSettings,
		platform: string, buildConfiguration: string,
		androidBuildData?: IAndroidBuildData,
		iOSBuildData?: IIOSBuildData): Promise<IBuildResultData> {
		const buildInformationString = `cloud build of '${projectSettings.projectDir}', platform: '${platform}', configuration: '${buildConfiguration}'`;
		this.$logger.info(`Starting ${buildInformationString}.`);

		await this.validateBuildProperties(platform, buildConfiguration, projectSettings.projectId, androidBuildData, iOSBuildData);
		let buildProps = await this.prepareBuildRequest(projectSettings, platform, buildConfiguration);

		if (this.$mobileHelper.isAndroidPlatform(platform)) {
			buildProps = await this.getAndroidBuildProperties(projectSettings, buildProps, androidBuildData);
		} else if (this.$mobileHelper.isiOSPlatform(platform)) {
			buildProps = await this.getiOSBuildProperties(projectSettings, buildProps, iOSBuildData);
		}

		const projectData = this.$projectDataService.getProjectData(projectSettings.projectDir);
		const platformAlreadyInstalled = _(this.$platformService.getInstalledPlatforms(projectData))
			.map(p => p.toLowerCase())
			.includes(platform.toLowerCase());
		if (!platformAlreadyInstalled) {
			await this.$platformService.addPlatforms([platform], null, projectData, <any>{}, null);
		}

		const buildResponse: IBuildResponse = await this.$buildCloudService.startBuild(projectSettings.projectId, buildProps);
		this.$logger.trace("Build response:");
		this.$logger.trace(buildResponse);

		await this.waitForBuildToFinish(buildResponse);

		const buildResult: IBuildResult = await this.getObjectFromS3File<IBuildResult>(buildResponse.resultUrl);

		this.$logger.trace("Build result:");
		this.$logger.trace(buildResult);

		if (!buildResult.buildItems || !buildResult.buildItems.length) {
			// Something failed.
			this.$errors.failWithoutHelp(`Build failed. Reason is: ${buildResult.errors}. Additional information: ${buildResult.stderr}.`);
		}

		this.$logger.info(`Finished ${buildInformationString} successfully. Downloading result...`);

		const localBuildResult = await this.downloadBuildResult(buildResult, {
			projectDir: projectSettings.projectDir,
			platform,
			emulator: iOSBuildData && !iOSBuildData.buildForDevice
		});

		this.$logger.info(`The result of ${buildInformationString} successfully downloaded. OutputFilePath: ${localBuildResult}`);

		const buildResultUrl = this.getBuildResultUrl(buildResult);
		const itmsOptions = {
			pathToProvision: iOSBuildData && iOSBuildData.pathToProvision,
			projectId: projectSettings.projectId,
			projectName: projectSettings.projectName,
			url: buildResultUrl
		};

		const fullOutput = await this.getContentOfS3File(buildResponse.outputUrl);

		const result = {
			stderr: buildResult.stderr,
			stdout: buildResult.stdout,
			fullOutput: fullOutput,
			outputFilePath: localBuildResult,
			qrData: {
				originalUrl: buildResultUrl,
				imageData: await this.getImageData(buildResultUrl, itmsOptions)
			}
		};

		const buildInfoFileDirname = path.dirname(result.outputFilePath);
		this.$platformService.saveBuildInfoFile(platform, projectSettings.projectDir, buildInfoFileDirname);
		return result;
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

	private async getObjectFromS3File<T>(pathToFile: string): Promise<T> {
		return JSON.parse(await this.getContentOfS3File(pathToFile));
	}

	private async getContentOfS3File(pathToFile: string): Promise<string> {
		return (await this.$httpClient.httpRequest(pathToFile)).body;
	}

	private waitForBuildToFinish(buildInformation: IBuildResponse): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			let outputCursorPosition = 0;
			let hasCheckedForBuildStatus = false;
			const buildIntervalId = setInterval(async () => {
				let buildStatus: IBuildStatus;
				try {
					buildStatus = await this.getObjectFromS3File<IBuildStatus>(buildInformation.statusUrl);
				} catch (err) {
					this.$logger.trace(err);
				}

				if (!hasCheckedForBuildStatus) {
					hasCheckedForBuildStatus = true;
				} else if (!buildStatus) {
					// We will get here if there is no build status twice in a row.
					clearInterval(buildIntervalId);
					return reject(new Error("Failed to start cloud build."));
				}

				if (!buildStatus) {
					return;
				}

				if (buildStatus.status === CloudBuildService.BUILD_COMPLETE_STATUS) {
					try {
						clearInterval(buildIntervalId);
						return resolve();
					} catch (err) {
						clearInterval(buildIntervalId);
						return reject(err);
					}
				}

				if (buildStatus.status === CloudBuildService.BUILD_FAILED_STATUS) {
					clearInterval(buildIntervalId);
					return reject(new Error("Build failed."));
				}

				if (buildStatus.status === CloudBuildService.BUILD_IN_PROGRESS_STATUS) {
					try {
						const logs: string = await this.getContentOfS3File(buildInformation.outputUrl);
						// The logs variable will contain the full build log and we need to log only the logs that we don't have.
						const contentToLog = this.$cloudBuildOutputFilter.filter(logs.substr(outputCursorPosition));
						if (contentToLog) {
							const data = { data: contentToLog, pipe: "stdout" };
							this.emit(constants.CLOUD_BUILD_EVENT_NAMES.BUILD_OUTPUT, data);
							this.$logger.info(contentToLog);
						}

						outputCursorPosition = logs.length <= 0 ? 0 : logs.length - 1;
					} catch (err) {
						// Ignore the error from getting the build output because the build can finish even if there is error.
						this.$logger.trace("Error while getting build logs:");
						this.$logger.trace(err);
					}
				}
			}, CloudBuildService.BUILD_STATUS_CHECK_INTERVAL);
		});
	}

	private async prepareBuildRequest(projectSettings: IProjectSettings,
		platform: string, buildConfiguration: string): Promise<any> {

		const projectZipFile = await this.zipProject(projectSettings.projectDir);
		const buildPreSignedUrlData = await this.uploadFileToS3(projectSettings.projectId, projectZipFile);

		// HACK just for this version. After that we'll have UI for getting runtime version.
		// Until then, use the coreModulesVersion.
		const coreModulesVersion = this.$fs.readJson(path.join(projectSettings.projectDir, "package.json")).dependencies["tns-core-modules"];
		const runtimeVersion = await this.getRuntimeVersion(platform, projectSettings.nativescriptData, coreModulesVersion);
		const cliVersion = await this.getCliVersion(runtimeVersion);
		const sanitizedProjectName = this.$projectHelper.sanitizeName(projectSettings.projectName);

		/** Although the nativescript-cloud is an extension that is used only with nativescript projects,
		 * current implementation of the builder daemon will not add default framework. This breaks tooling when incremental build is
		 * performed. Passing the framework=tns here is more consistent that adding conditional
		 * behavior in the tooling.
		 */
		return {
			properties: {
				buildConfiguration: buildConfiguration,
				platform: platform,
				appIdentifier: projectSettings.projectId,
				frameworkVersion: cliVersion,
				runtimeVersion: runtimeVersion,
				sessionKey: buildPreSignedUrlData.sessionKey,
				templateAppName: sanitizedProjectName,
				projectName: sanitizedProjectName,
				framework: "tns",
				useIncrementalBuild: !projectSettings.clean
			},
			buildFiles: [
				{
					disposition: "PackageZip",
					sourceUri: buildPreSignedUrlData.s3Url
				}
			]
		};

	}

	private async uploadFileToS3(projectId: string, filePathOrContent: string, fileNameInS3?: string): Promise<IAmazonStorageEntryData> {
		fileNameInS3 = fileNameInS3 || uuid.v4();
		const preSignedUrlData = await this.$buildCloudService.getPresignedUploadUrlObject(projectId, fileNameInS3);

		const requestOpts: any = {
			url: preSignedUrlData.uploadPreSignedUrl,
			method: constants.HTTP_METHODS.PUT
		};

		if (this.$fs.exists(filePathOrContent)) {
			requestOpts.body = this.$fs.readFile(filePathOrContent);
		} else {
			requestOpts.body = filePathOrContent;
		}

		requestOpts.headers = requestOpts.headers || {};
		// It is vital we set this, else the http request comes out as chunked and S3 doesn't support chunked requests
		requestOpts.headers["Content-Length"] = requestOpts.body.length;

		try {
			await this.$httpClient.httpRequest(requestOpts);
		} catch (err) {
			this.$errors.failWithoutHelp(`Error while uploading ${filePathOrContent} to S3. Errors is:`, err.message);
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

		const buildConfiguration = buildProps.properties.buildConfiguration;

		if (this.isReleaseConfiguration(buildConfiguration)) {
			const certificateS3Data = await this.uploadFileToS3(projectSettings.projectId, androidBuildData.pathToCertificate);

			buildProps.properties.keyStoreName = certificateS3Data.fileNameInS3;
			buildProps.properties.keyStoreAlias = this.getCertificateInfo(androidBuildData.pathToCertificate, androidBuildData.certificatePassword).friendlyName;
			buildProps.properties.keyStorePassword = androidBuildData.certificatePassword;
			buildProps.properties.keyStoreAliasPassword = androidBuildData.certificatePassword;

			buildProps.buildFiles.push({
				disposition: "CryptoStore",
				sourceUri: certificateS3Data.s3Url
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

			buildProps.buildFiles.push(
				{
					sourceUri: certificateS3Data.s3Url,
					disposition: "Keychain"
				},
				{
					sourceUri: provisonS3Data.s3Url,
					disposition: "Provision"
				}
			);

			buildProps.properties.certificatePassword = iOSBuildData.certificatePassword;
			buildProps.properties.codeSigningIdentity = this.getCertificateInfo(iOSBuildData.pathToCertificate, iOSBuildData.certificatePassword).commonName;

			const cloudProvisionsData: any[] = [{
				suffixId: "",
				templateName: "PROVISION_",
				identifier: provisionData.UUID,
				isDefault: true,
				fileName: `${provisonS3Data.fileNameInS3}`,
				appGroups: [],
				provisionType: this.getProvisionType(provisionData),
				name: provisionData.Name
			}];
			buildProps.properties.mobileProvisionIdentifiers = JSON.stringify(cloudProvisionsData);
			buildProps.properties.defaultMobileProvisionIdentifier = provisionData.UUID;
		} else {
			buildProps.properties.simulator = true;
		}

		return buildProps;
	}

	private getProvisionType(provisionData: IMobileProvisionData): string {
		let result = "";
		if (provisionData.Entitlements['get-task-allow']) {
			result = constants.PROVISION_TYPES.DEVELOPMENT;
		} else {
			result = constants.PROVISION_TYPES.ADHOC;
		}

		if (!provisionData.ProvisionedDevices || !provisionData.ProvisionedDevices.length) {
			if (provisionData.ProvisionsAllDevices) {
				result = constants.PROVISION_TYPES.ENTERPRISE;
			} else {
				result = constants.PROVISION_TYPES.APP_STORE;
			}
		}

		return result;
	}

	private getBuildResultUrl(buildResult: IBuildResult): string {
		return this.getBuildResult(buildResult).fullPath;
	}

	private getBuildResult(buildResult: IBuildResult): IBuildItem {
		const result = _.find(buildResult.buildItems, b => b.disposition === "BuildResult");

		if (!result) {
			this.$errors.failWithoutHelp("No item with disposition BuildResult found in the build result items.");
		}

		return result;
	}

	private async downloadBuildResult(buildResult: IBuildResult, buildOutputOptions: ICloudBuildOutputDirectoryOptions): Promise<string> {
		const destinationDir = this.getBuildOutputDirectory(buildOutputOptions);
		this.$fs.ensureDirectoryExists(destinationDir);

		const buildResultObj = this.getBuildResult(buildResult);
		const targetFileName = path.join(destinationDir, buildResultObj.filename);
		const targetFile = this.$fs.createWriteStream(targetFileName);

		// Download the output file.
		await this.$httpClient.httpRequest({
			url: buildResultObj.fullPath,
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

		await this.$fs.zipFiles(projectZipFile, files, p => this.getProjectRelativePath(p, projectDir));

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

	private async getRuntimeVersion(platform: string, nativescriptData: any, coreModulesVersion: string): Promise<string> {
		const runtimePackageName = `tns-${platform.toLowerCase()}`;
		let runtimeVersion = nativescriptData && nativescriptData[runtimePackageName] && nativescriptData[runtimePackageName].version;
		if (!runtimeVersion && coreModulesVersion) {
			// no runtime added. Let's find out which one we need based on the tns-core-modules.
			if (semver.valid(coreModulesVersion)) {
				runtimeVersion = await this.getLatestMatchingVersion(runtimePackageName, this.getVersionRangeWithTilde(coreModulesVersion));
			} else if (semver.validRange(coreModulesVersion)) {
				// In case tns-core-modules in package.json are referred as `~x.x.x` - this is not a valid version, but is valid range.
				runtimeVersion = await this.getLatestMatchingVersion(runtimePackageName, coreModulesVersion);
			}
		}

		return runtimeVersion || CloudBuildService.DEFAULT_VERSION;
	}

	private async getCliVersion(runtimeVersion: string): Promise<string> {
		try {
			const latestMatchingVersion = await this.getLatestMatchingVersion("nativescript", this.getVersionRangeWithTilde(runtimeVersion));
			return latestMatchingVersion || CloudBuildService.DEFAULT_VERSION;
		} catch (err) {
			this.$logger.trace(`Unable to get information about CLI versions. Error is: ${err.message}`);
			return `${semver.major(runtimeVersion)}.${semver.minor(runtimeVersion)}.0`;
		}
	}

	private async getLatestMatchingVersion(packageName: string, range: string): Promise<string> {
		const versions = await this.getVersionsFromNpm(packageName);
		if (versions.length) {
			return semver.maxSatisfying(versions, range);
		}

		return null;
	}

	private async getVersionsFromNpm(packageName: string): Promise<string[]> {
		try {
			const response = await this.$httpClient.httpRequest(`http://registry.npmjs.org/${packageName}`);
			const versions = _.keys(JSON.parse(response.body).versions);
			return versions;
		} catch (err) {
			this.$logger.trace(`Unable to get versions of ${packageName} from npm. Error is: ${err.message}.`);
			return [];
		}
	}

	private getVersionRangeWithTilde(versionString: string): string {
		return `~${semver.major(versionString)}.${semver.minor(versionString)}.0`;
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

	private async getImageData(buildResultUrl: string, options: IItmsPlistOptions): Promise<string> {
		if (options.pathToProvision) {
			const provisionData = this.getMobileProvisionData(options.pathToProvision);
			const provisionType = this.getProvisionType(provisionData);
			if (provisionType !== constants.PROVISION_TYPES.ADHOC) {
				return null;
			}

			const amazonPlistEntry = await this.uploadFileToS3(options.projectId, this.$itmsServicesPlistHelper.createPlistContent(options));
			return this.$qr.generateDataUri(`itms-services://?action=download-manifest&amp;url=${escape(amazonPlistEntry.publicDownloadUrl)}`);
		}

		return this.$qr.generateDataUri(buildResultUrl);
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
