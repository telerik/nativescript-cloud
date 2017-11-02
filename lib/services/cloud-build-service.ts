import * as path from "path";
import * as semver from "semver";
import * as uuid from "uuid";
import * as forge from "node-forge";
import * as minimatch from "minimatch";
import { escape } from "querystring";
import { EOL } from "os";
import * as constants from "../constants";
import { CloudService } from "./cloud-service";
const plist = require("simple-plist");

export class CloudBuildService extends CloudService implements ICloudBuildService {
	private static DEFAULT_VERSION = "3.0.0";

	protected get failedError() {
		return "Build failed.";
	}

	protected get failedToStartError() {
		return "Failed to start cloud build.";
	}

	constructor($fs: IFileSystem,
		$httpClient: Server.IHttpClient,
		$logger: ILogger,
		private $errors: IErrors,
		private $mobileHelper: Mobile.IMobileHelper,
		private $nsCloudAccountsService: IAccountsService,
		private $nsCloudBuildCloudService: IBuildCloudService,
		private $nsCloudBuildOutputFilter: ICloudBuildOutputFilter,
		private $nsCloudGitService: IGitService,
		private $nsCloudItmsServicesPlistHelper: IItmsServicesPlistHelper,
		private $nsCloudUploadService: IUploadService,
		private $nsCloudUserService: IUserService,
		private $platformService: IPlatformService,
		private $projectHelper: IProjectHelper,
		private $projectDataService: IProjectDataService,
		private $qr: IQrCodeGenerator) {
		super($fs, $httpClient, $logger);
	}

	public getServerOperationOutputDirectory(options: ICloudServerOutputDirectoryOptions): string {
		let result = path.join(options.projectDir, constants.CLOUD_TEMP_DIR_NAME, options.platform.toLowerCase());
		if (this.$mobileHelper.isiOSPlatform(options.platform)) {
			result = path.join(result, options.emulator ? constants.CLOUD_BUILD_DIRECTORY_NAMES.EMULATOR : constants.CLOUD_BUILD_DIRECTORY_NAMES.DEVICE);
		}

		return result;
	}

	/**
	 * Here only for backwards compatibility.
	 */
	public getBuildOutputDirectory(options: ICloudBuildOutputDirectoryOptions): string {
		return this.getServerOperationOutputDirectory(options);
	}

	public async build(projectSettings: IProjectSettings,
		platform: string,
		buildConfiguration: string,
		accountId: string,
		androidBuildData?: IAndroidBuildData,
		iOSBuildData?: IIOSBuildData): Promise<IBuildResultData> {
		const buildId = uuid.v4();
		const account = await this.$nsCloudAccountsService.getAccountFromOption(accountId);
		try {
			const buildResult = await this.executeBuild(projectSettings, platform, buildConfiguration, buildId, account.id, androidBuildData, iOSBuildData);
			return buildResult;
		} catch (err) {
			err.buildId = buildId;
			throw err;
		}
	}

	public async executeBuild(projectSettings: IProjectSettings,
		platform: string,
		buildConfiguration: string,
		buildId: string,
		accountId: string,
		androidBuildData?: IAndroidBuildData,
		iOSBuildData?: IIOSBuildData): Promise<IBuildResultData> {
		const buildInformationString = `cloud build of '${projectSettings.projectDir}', platform: '${platform}', ` +
			`configuration: '${buildConfiguration}', buildId: ${buildId}`;
		this.$logger.info(`Starting ${buildInformationString}.`);

		await this.validateBuildProperties(platform, buildConfiguration, projectSettings.projectId, androidBuildData, iOSBuildData);
		await this.prepareProject(buildId, projectSettings, platform, buildConfiguration, iOSBuildData);
		let buildFiles: IServerItemBase[] = [];
		if (this.$mobileHelper.isAndroidPlatform(platform) && this.isReleaseConfiguration(buildConfiguration)) {
			buildFiles.push({
				filename: uuid.v4(),
				fullPath: androidBuildData.pathToCertificate,
				disposition: constants.DISPOSITIONS.CRYPTO_STORE
			});
		} else if (this.$mobileHelper.isiOSPlatform(platform) && iOSBuildData.buildForDevice) {
			buildFiles.push({
				filename: uuid.v4(),
				fullPath: iOSBuildData.pathToCertificate,
				disposition: constants.DISPOSITIONS.KEYCHAIN
			});
			const provisionData = this.getMobileProvisionData(iOSBuildData.pathToProvision);
			buildFiles.push({
				filename: `${provisionData.UUID}.mobileprovision`,
				fullPath: iOSBuildData.pathToProvision,
				disposition: constants.DISPOSITIONS.PROVISION
			});
		}

		const fileNames = buildFiles.map(buildFile => buildFile.filename);
		const buildCredentials = await this.$nsCloudBuildCloudService.getBuildCredentials({ appId: projectSettings.projectId, fileNames: fileNames });

		const filesToUpload = this.prepareFilesToUpload(buildCredentials.urls, buildFiles);
		let buildProps = await this.prepareBuildRequest(buildId, projectSettings, platform, buildConfiguration, buildCredentials, filesToUpload, accountId);
		if (this.$mobileHelper.isAndroidPlatform(platform)) {
			buildProps = await this.getAndroidBuildProperties(projectSettings, buildProps, filesToUpload, androidBuildData);
		} else if (this.$mobileHelper.isiOSPlatform(platform)) {
			buildProps = await this.getiOSBuildProperties(projectSettings, buildProps, filesToUpload, iOSBuildData);
		}

		this.emitStepChanged(buildId, constants.BUILD_STEP_NAME.BUILD, constants.BUILD_STEP_PROGRESS.START);
		const buildResponse: IServerResponse = await this.$nsCloudBuildCloudService.startBuild(buildProps);
		this.$logger.trace("Build response:");
		this.$logger.trace(buildResponse);
		await this.waitForServerOperationToFinish(buildId, buildResponse);
		const buildResult: IServerResult = await this.getObjectFromS3File<IServerResult>(buildResponse.resultUrl);
		this.emitStepChanged(buildId, constants.BUILD_STEP_NAME.BUILD, constants.BUILD_STEP_PROGRESS.END);

		this.$logger.trace("Build result:");
		this.$logger.trace(buildResult);

		if (!buildResult.buildItems || !buildResult.buildItems.length) {
			// Something failed.
			this.$errors.failWithoutHelp(`Build failed. Reason is: ${buildResult.errors}. Additional information: ${buildResult.stderr}.`);
		}

		this.$logger.info(`Finished ${buildInformationString} successfully. Downloading result...`);

		const localBuildResult = await this.downloadServerResult(buildId, buildResult, {
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
			buildId,
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

	private prepareFilesToUpload(amazonStorageEntries: IAmazonStorageEntry[], buildFiles: IServerItemBase[]): IAmazonStorageEntryData[] {
		let result: IAmazonStorageEntryData[] = [];
		_.each(amazonStorageEntries, amazonStorageEntry => {
			_.each(buildFiles, buildFile => {
				if (amazonStorageEntry.fileName === buildFile.filename) {
					result.push(_.merge({ filePath: buildFile.fullPath, disposition: buildFile.disposition }, amazonStorageEntry));
				}
			});
		});

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

	private async prepareProject(buildId: string,
		projectSettings: IProjectSettings,
		platform: string,
		buildConfiguration: string,
		iOSBuildData: IIOSBuildData): Promise<void> {

		const projectData = this.$projectDataService.getProjectData(projectSettings.projectDir);
		const appFilesUpdaterOptions: IAppFilesUpdaterOptions = {
			// This option is used for webpack. As currently we do not support webpack, set it to false.
			// TODO: Once we have a way to use webpack in cloud builds, we should pass correct value here.
			bundle: false,
			release: buildConfiguration && buildConfiguration.toLowerCase() === constants.CLOUD_BUILD_CONFIGURATIONS.RELEASE.toLowerCase()
		};

		let mobileProvisionData: IMobileProvisionData;
		let provision: string;

		if (iOSBuildData && iOSBuildData.pathToProvision) {
			mobileProvisionData = this.getMobileProvisionData(iOSBuildData.pathToProvision);
			mobileProvisionData.Type = this.getProvisionType(mobileProvisionData);
			provision = mobileProvisionData.UUID;
		}

		const config: IPlatformOptions = {
			provision,
			mobileProvisionData,
			sdk: null,
			frameworkPath: null,
			ignoreScripts: false,
			teamId: undefined
		};

		this.emitStepChanged(buildId, constants.BUILD_STEP_NAME.PREPARE, constants.BUILD_STEP_PROGRESS.START);
		await this.$platformService.preparePlatform({
			platform,
			appFilesUpdaterOptions,
			projectData,
			config,
			filesToSync: [],
			nativePrepare: { skipNativePrepare: true },
			platformTemplate: null,
			env: projectSettings.env
		});
		this.emitStepChanged(buildId, constants.BUILD_STEP_NAME.PREPARE, constants.BUILD_STEP_PROGRESS.END);
	}

	private async prepareBuildRequest(buildId: string,
		projectSettings: IProjectSettings,
		platform: string,
		buildConfiguration: string,
		buildCredentials: IBuildCredentialResponse,
		filesToUpload: IAmazonStorageEntryData[],
		accountId: string): Promise<IBuildRequestData> {
		this.emitStepChanged(buildId, constants.BUILD_STEP_NAME.UPLOAD, constants.BUILD_STEP_PROGRESS.START);
		let buildFiles;
		try {
			await this.$nsCloudGitService.gitPushChanges(projectSettings.projectDir,
				{ httpRemoteUrl: buildCredentials.codeCommit.cloneUrlHttp },
				buildCredentials.codeCommit.credentials,
				{ isNewRepository: buildCredentials.codeCommit.isNewRepository });

			buildFiles = [
				{
					disposition: constants.DISPOSITIONS.PACKAGE_GIT,
					sourceUri: buildCredentials.codeCommitUrl
				}
			];
		} catch (err) {
			this.$logger.warn(err.message);
			const filePath = await this.zipProject(projectSettings.projectDir);
			const preSignedUrlData = await this.$nsCloudBuildCloudService.getPresignedUploadUrlObject(uuid.v4());
			const disposition = constants.DISPOSITIONS.PACKAGE_ZIP;
			filesToUpload.push(_.merge({ filePath, disposition }, preSignedUrlData));
			buildFiles = [
				{
					disposition,
					sourceUri: preSignedUrlData.s3Url
				}
			];
		}

		for (const fileToUpload of filesToUpload) {
			await this.$nsCloudUploadService.uploadToS3(fileToUpload.filePath, fileToUpload.fileName, fileToUpload.uploadPreSignedUrl);
		}

		this.emitStepChanged(buildId, constants.BUILD_STEP_NAME.UPLOAD, constants.BUILD_STEP_PROGRESS.END);
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
			accountId,
			properties: {
				buildId,
				buildConfiguration: buildConfiguration,
				platform: platform,
				appIdentifier: projectSettings.projectId,
				frameworkVersion: cliVersion,
				runtimeVersion: runtimeVersion,
				sessionKey: buildCredentials.sessionKey,
				templateAppName: sanitizedProjectName,
				projectName: sanitizedProjectName,
				framework: "tns",
				useIncrementalBuild: !projectSettings.clean,
				userEmail: this.$nsCloudUserService.getUser().email
			},
			targets: [],
			buildFiles
		};
	}

	private getCertificateBase64(cert: string) {
		return cert.replace(/\s/g, "").substr(constants.CRYPTO.CERTIFICATE_HEADER.length).slice(0, -constants.CRYPTO.CERTIFICATE_FOOTER.length);
	}

	private async getAndroidBuildProperties(projectSettings: IProjectSettings,
		buildProps: any,
		amazonStorageEntriesData: IAmazonStorageEntryData[],
		androidBuildData?: IAndroidBuildData): Promise<any> {

		const buildConfiguration = buildProps.properties.buildConfiguration;

		if (this.isReleaseConfiguration(buildConfiguration)) {
			const certificateData = _.find(amazonStorageEntriesData, amazonStorageEntryData => amazonStorageEntryData.filePath === androidBuildData.pathToCertificate);
			buildProps.properties.keyStoreName = certificateData.fileName;
			buildProps.properties.keyStoreAlias = this.getCertificateInfo(androidBuildData.pathToCertificate, androidBuildData.certificatePassword).friendlyName;
			buildProps.properties.keyStorePassword = androidBuildData.certificatePassword;
			buildProps.properties.keyStoreAliasPassword = androidBuildData.certificatePassword;

			buildProps.buildFiles.push({
				disposition: certificateData.disposition,
				sourceUri: certificateData.s3Url
			});
		}

		return buildProps;
	}

	private async getiOSBuildProperties(projectSettings: IProjectSettings,
		buildProps: any,
		amazonStorageEntriesData: IAmazonStorageEntryData[],
		iOSBuildData: IIOSBuildData): Promise<any> {

		if (iOSBuildData.buildForDevice) {
			const provisionData = this.getMobileProvisionData(iOSBuildData.pathToProvision);
			const certificateData = _.find(amazonStorageEntriesData, amazonStorageEntryData => amazonStorageEntryData.filePath === iOSBuildData.pathToCertificate);
			const provisonData = _.find(amazonStorageEntriesData, amazonStorageEntryData => amazonStorageEntryData.filePath === iOSBuildData.pathToProvision);

			buildProps.buildFiles.push(
				{
					sourceUri: certificateData.s3Url,
					disposition: certificateData.disposition
				},
				{
					sourceUri: provisonData.s3Url,
					disposition: provisonData.disposition
				}
			);

			buildProps.properties.certificatePassword = iOSBuildData.certificatePassword;
			buildProps.properties.codeSigningIdentity = this.getCertificateInfo(iOSBuildData.pathToCertificate, iOSBuildData.certificatePassword).commonName;

			const cloudProvisionsData: any[] = [{
				suffixId: "",
				templateName: "PROVISION_",
				identifier: provisionData.UUID,
				isDefault: true,
				fileName: provisonData.fileName,
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

	private getBuildResultUrl(buildResult: IServerResult): string {
		// We expect only one buildResult - .ipa, .apk ...
		return this.getServerResults(buildResult)[0].fullPath;
	}

	protected getServerResults(buildResult: IServerResult): IServerItem[] {
		const result = _.find(buildResult.buildItems, b => b.disposition === constants.DISPOSITIONS.BUILD_RESULT);

		if (!result) {
			this.$errors.failWithoutHelp("No item with disposition BuildResult found in the build result items.");
		}

		return [result];
	}

	protected async getServerLogs(logsUrl: string, buildId: string): Promise<void> {
		try {
			const logs = await this.getContentOfS3File(logsUrl);
			// The logs variable will contain the full server log and we need to log only the logs that we don't have.
			const contentToLog = this.$nsCloudBuildOutputFilter.filter(logs.substr(this.outputCursorPosition));
			if (contentToLog) {
				const data: IBuildLog = { buildId, data: contentToLog, pipe: "stdout" };
				this.emit(constants.CLOUD_BUILD_EVENT_NAMES.BUILD_OUTPUT, data);
				this.$logger.info(contentToLog);
			}

			this.outputCursorPosition = logs.length <= 0 ? 0 : logs.length - 1;
		} catch (err) {
			// Ignore the error from getting the server output because the task can finish even if there is error.
			this.$logger.trace(`Error while getting server logs: ${err}`);
		}
	}

	private async downloadServerResult(buildId: string, buildResult: IServerResult, buildOutputOptions: ICloudServerOutputDirectoryOptions): Promise<string> {
		this.emitStepChanged(buildId, constants.BUILD_STEP_NAME.DOWNLOAD, constants.BUILD_STEP_PROGRESS.START);
		const targetFileNames = await super.downloadServerResults(buildResult, buildOutputOptions);
		this.emitStepChanged(buildId, constants.BUILD_STEP_NAME.DOWNLOAD, constants.BUILD_STEP_PROGRESS.END);
		return targetFileNames[0];
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

			const preSignedUrlData = await this.$nsCloudBuildCloudService.getPresignedUploadUrlObject(uuid.v4());
			await this.$nsCloudUploadService.uploadToS3(this.$nsCloudItmsServicesPlistHelper.createPlistContent(options), preSignedUrlData.fileName, preSignedUrlData.uploadPreSignedUrl);
			return this.$qr.generateDataUri(`itms-services://?action=download-manifest&amp;url=${escape(preSignedUrlData.publicDownloadUrl)}`);
		}

		return this.$qr.generateDataUri(buildResultUrl);
	}

	private getMobileProvisionData(provisionPath: string): IMobileProvisionData {
		const provisionText = this.$fs.readText(path.resolve(provisionPath));
		const provisionPlistText = provisionText.substring(provisionText.indexOf(constants.CRYPTO.PLIST_HEADER), provisionText.indexOf(constants.CRYPTO.PLIST_FOOTER) + constants.CRYPTO.PLIST_FOOTER.length);
		return plist.parse(provisionPlistText);
	}

	private isReleaseConfiguration(buildConfiguration: string): boolean {
		return buildConfiguration.toLowerCase() === constants.CLOUD_BUILD_CONFIGURATIONS.RELEASE.toLowerCase();
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

	private emitStepChanged(buildId: string, step: string, progress: number): void {
		const buildStep: IBuildStep = { buildId, step, progress };
		this.emit(constants.CLOUD_BUILD_EVENT_NAMES.STEP_CHANGED, buildStep);
	}
}

$injector.register("nsCloudBuildService", CloudBuildService);
