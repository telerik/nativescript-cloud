import * as path from "path";
import * as semver from "semver";
import * as uuid from "uuid";
import { escape } from "querystring";
import * as constants from "../constants";
import { CloudService } from "./cloud-service";

export class CloudBuildService extends CloudService implements ICloudBuildService {
	protected get failedError() {
		return "Build failed.";
	}

	protected get failedToStartError() {
		return "Failed to start cloud build.";
	}

	constructor($errors: IErrors,
		$fs: IFileSystem,
		$httpClient: Server.IHttpClient,
		$logger: ILogger,
		$nsCloudOperationFactory: ICloudOperationFactory,
		$nsCloudS3Service: IS3Service,
		$nsCloudOutputFilter: ICloudOutputFilter,
		$processService: IProcessService,
		private $nsCloudBuildHelper: ICloudBuildHelper,
		private $nsCloudBuildPropertiesService: ICloudBuildPropertiesService,
		private $mobileHelper: Mobile.IMobileHelper,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $nsCloudConfigurationService: ICloudConfigurationService,
		private $nsCloudAccountsService: IAccountsService,
		private $nsCloudServerBuildService: IServerBuildService,
		private $nsCloudGitService: IGitService,
		private $nsCloudItmsServicesPlistHelper: IItmsServicesPlistHelper,
		private $nsCloudUploadService: IUploadService,
		private $nsCloudUserService: IUserService,
		private $nsCloudVersionService: IVersionService,
		private $nsCloudEncryptionService: ICloudEncryptionService,
		private $platformService: IPlatformService,
		private $projectHelper: IProjectHelper,
		private $projectDataService: IProjectDataService,
		private $qr: IQrCodeGenerator,
		private $staticConfig: IStaticConfig,
		private $platformsData: IPlatformsData,
		private $filesHashService: IFilesHashService) {
		super($errors, $fs, $httpClient, $logger, $nsCloudOperationFactory, $nsCloudS3Service, $nsCloudOutputFilter, $processService);
	}

	public getServerOperationOutputDirectory(options: IOutputDirectoryOptions): string {
		let result = path.join(options.projectDir, constants.CLOUD_TEMP_DIR_NAME, options.platform.toLowerCase());
		if (this.$mobileHelper.isiOSPlatform(options.platform)) {
			result = path.join(result, options.emulator ? constants.CLOUD_BUILD_DIRECTORY_NAMES.EMULATOR : constants.CLOUD_BUILD_DIRECTORY_NAMES.DEVICE);
		}

		return result;
	}

	/**
	 * Here only for backwards compatibility. Deleting this will require a major version change as it is used in NativeScript Sidekick.
	 */
	public getBuildOutputDirectory(options: ICloudBuildOutputDirectoryOptions): string {
		return this.getServerOperationOutputDirectory(options);
	}

	public async build(projectSettings: INSCloudProjectSettings,
		platform: string,
		buildConfiguration: string,
		accountId: string,
		androidBuildData?: IAndroidBuildData,
		iOSBuildData?: IIOSBuildData): Promise<IBuildResultData> {
		const result = await this.executeCloudOperation("Cloud build", async (cloudOperationId: string): Promise<IBuildResultData> => {
			this.$logger.info("Getting accounts information...");
			const account = await this.$nsCloudAccountsService.getAccountFromOption(accountId);
			this.$logger.info("Using account %s.", account.id);
			const buildResult = await this.executeBuild(projectSettings, platform, buildConfiguration, cloudOperationId, account.id, androidBuildData, iOSBuildData);
			return buildResult;
		});

		return result;
	}

	public async executeBuild(projectSettings: INSCloudProjectSettings,
		platform: string,
		buildConfiguration: string,
		cloudOperationId: string,
		accountId: string,
		androidBuildData?: IAndroidBuildData,
		iOSBuildData?: IIOSBuildData): Promise<IBuildResultData> {
		const buildInformationString = `Cloud build of '${projectSettings.projectDir}', platform: '${platform}', ` +
			`configuration: '${buildConfiguration}'`;
		this.$logger.info(`${buildInformationString}.`);

		await this.$nsCloudBuildPropertiesService.validateBuildProperties(platform, buildConfiguration, projectSettings.projectId, androidBuildData, iOSBuildData);
		await this.prepareProject(cloudOperationId, projectSettings, platform, buildConfiguration, iOSBuildData);
		let buildFiles: IServerItemBase[] = [];
		if (this.$mobileHelper.isAndroidPlatform(platform) && this.$nsCloudBuildHelper.isReleaseConfiguration(buildConfiguration)) {
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
			const provisionData = this.$nsCloudBuildHelper.getMobileProvisionData(iOSBuildData.pathToProvision);
			buildFiles.push({
				filename: `${provisionData.UUID}.mobileprovision`,
				fullPath: iOSBuildData.pathToProvision,
				disposition: constants.DISPOSITIONS.PROVISION
			});
		}

		const fileNames = buildFiles.map(buildFile => buildFile.filename);
		const buildCredentials = await this.$nsCloudServerBuildService.getBuildCredentials({ appId: projectSettings.projectId, fileNames: fileNames });

		const filesToUpload = this.prepareFilesToUpload(buildCredentials.urls, buildFiles);
		const additionalCliFlags: string[] = [];
		if (projectSettings.bundle) {
			additionalCliFlags.push("--bundle");
		}

		if (projectSettings.useHotModuleReload) {
			additionalCliFlags.push("--hmr");
		}

		if (projectSettings.env) {
			const envOptions = _.map(projectSettings.env, (value, key) => `--env.${key}=${value}`);
			additionalCliFlags.push(...envOptions);
		}

		let buildProps = await this.prepareBuildRequest({
			cloudOperationId: cloudOperationId,
			projectSettings,
			platform,
			buildConfiguration,
			buildCredentials,
			filesToUpload,
			additionalCliFlags,
			accountId
		});
		if (this.$mobileHelper.isAndroidPlatform(platform)) {
			buildProps = await this.$nsCloudBuildPropertiesService.getAndroidBuildProperties(projectSettings, buildProps, filesToUpload, androidBuildData);
		} else if (this.$mobileHelper.isiOSPlatform(platform)) {
			buildProps = await this.$nsCloudBuildPropertiesService.getiOSBuildProperties(projectSettings, buildProps, filesToUpload, iOSBuildData);
		}

		this.emitStepChanged(cloudOperationId, constants.BUILD_STEP_NAME.BUILD, constants.BUILD_STEP_PROGRESS.START);
		const buildResponse: IServerResponse = await this.$nsCloudServerBuildService.startBuild(buildProps);
		this.$logger.trace("Build response:");
		this.$logger.trace(buildResponse);
		const buildResult: ICloudOperationResult = await this.waitForCloudOperationToFinish(cloudOperationId, buildResponse, { silent: false });
		this.emitStepChanged(cloudOperationId, constants.BUILD_STEP_NAME.BUILD, constants.BUILD_STEP_PROGRESS.END);

		this.$logger.trace("Build result:");
		this.$logger.trace(buildResult);

		if (!buildResult.buildItems || !buildResult.buildItems.length) {
			// Something failed.
			this.$errors.failWithoutHelp(`Build failed. Reason is: ${buildResult.errors}. Additional information: ${buildResult.stderr}.`);
		}

		this.$logger.info(`Finished ${buildInformationString} successfully. Downloading result...`);

		const localBuildResult = await this.downloadServerResult(cloudOperationId, buildResult, {
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

		const result = {
			cloudOperationId: cloudOperationId,
			stderr: buildResult.stderr,
			stdout: buildResult.stdout,
			outputFilePath: localBuildResult,
			qrData: {
				originalUrl: buildResultUrl,
				imageData: await this.getImageData(buildResultUrl, itmsOptions)
			}
		};

		// In case HMR is passed, do not save the hashes as the files generated in the cloud may differ from the local ones.
		// We need to get the hashes from the cloud build, so until we have it, it is safer to execute fullSync after build.
		// This way we'll be sure HMR is working with cloud builds as it will rely on the local files.
		if ((<any>this.$filesHashService).saveHashesForProject && !projectSettings.useHotModuleReload) {
			const platformData = this.$platformsData.getPlatformData(platform, this.$projectDataService.getProjectData(projectSettings.projectDir));
			await (<any>this.$filesHashService).saveHashesForProject(platformData, path.dirname(localBuildResult));
		}

		const buildInfoFileDirname = path.dirname(result.outputFilePath);
		this.$platformService.saveBuildInfoFile(platform, projectSettings.projectDir, buildInfoFileDirname);
		return result;
	}

	public validateBuildProperties(platform: string,
		buildConfiguration: string,
		appId: string,
		androidBuildData?: IAndroidBuildData,
		iOSBuildData?: IIOSBuildData): Promise<void> {
		return this.$nsCloudBuildPropertiesService.validateBuildProperties(platform, buildConfiguration, appId, androidBuildData, iOSBuildData);
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

	private async prepareProject(cloudOperationId: string,
		projectSettings: INSCloudProjectSettings,
		platform: string,
		buildConfiguration: string,
		iOSBuildData: IIOSBuildData): Promise<void> {

		const projectData = this.$projectDataService.getProjectData(projectSettings.projectDir);
		const appFilesUpdaterOptions: IAppFilesUpdaterOptions = {
			bundle: projectSettings.bundle,
			useHotModuleReload: projectSettings.useHotModuleReload,
			release: buildConfiguration && buildConfiguration.toLowerCase() === constants.CLOUD_BUILD_CONFIGURATIONS.RELEASE.toLowerCase()
		};

		let mobileProvisionData: IMobileProvisionData;
		let provision: string;

		if (iOSBuildData && iOSBuildData.pathToProvision) {
			mobileProvisionData = this.$nsCloudBuildHelper.getMobileProvisionData(iOSBuildData.pathToProvision);
			mobileProvisionData.Type = this.$nsCloudBuildHelper.getProvisionType(mobileProvisionData);
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

		this.emitStepChanged(cloudOperationId, constants.BUILD_STEP_NAME.PREPARE, constants.BUILD_STEP_PROGRESS.START);
		const cliVersion = this.$staticConfig.version;

		// HACK: Ensure __PACKAGE__ is interpolated in app.gradle file in the user project.
		// In case we don't interpolate every other cloud android build is bound to fail because it would set the application's identifier to __PACKAGE__
		const userAppGradleFilePath = path.join(projectData.appResourcesDirectoryPath, this.$devicePlatformsConstants.Android, "app.gradle");
		if (this.$fs.exists(userAppGradleFilePath)) {
			const appGradleContents = this.$fs.readText(userAppGradleFilePath);
			const appGradleReplacedContents = appGradleContents.replace(/__PACKAGE__/g, projectSettings.projectId);
			if (appGradleReplacedContents !== appGradleContents) {
				this.$fs.writeFile(userAppGradleFilePath, appGradleReplacedContents);
			}
		}

		const shouldUseOldPrepare = semver.valid(cliVersion) && semver.lt(cliVersion, semver.prerelease(cliVersion) ? "3.4.0-2017-11-02-10045" : "3.4.0");
		if (shouldUseOldPrepare) {
			// Backwards compatibility as preparePlatform method has different args in old versions
			this.$logger.trace(`Using old prepare as CLI version is ${cliVersion}.`);
			await (<any>this.$platformService).preparePlatform(platform, appFilesUpdaterOptions, null, projectData, config, [], { skipNativePrepare: true });
		} else {
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
		}
		this.emitStepChanged(cloudOperationId, constants.BUILD_STEP_NAME.PREPARE, constants.BUILD_STEP_PROGRESS.END);
	}

	private async prepareBuildRequest(settings: IPrepareBuildRequestInfo): Promise<IBuildRequestData> {
		this.emitStepChanged(settings.cloudOperationId, constants.BUILD_STEP_NAME.UPLOAD, constants.BUILD_STEP_PROGRESS.START);
		let buildFiles;
		try {
			await this.$nsCloudGitService.gitPushChanges(settings.projectSettings,
				{ httpRemoteUrl: settings.buildCredentials.codeCommit.cloneUrlHttp },
				settings.buildCredentials.codeCommit.credentials,
				{ isNewRepository: settings.buildCredentials.codeCommit.isNewRepository });

			buildFiles = [
				{
					disposition: constants.DISPOSITIONS.PACKAGE_GIT,
					sourceUri: settings.buildCredentials.codeCommitUrl
				}
			];
		} catch (err) {
			this.$logger.warn("Unable to use git, reason is:");
			this.$logger.warn(err.message);
			const filePath = await this.$nsCloudBuildHelper.zipProject(settings.projectSettings.projectDir);
			const preSignedUrlData = await this.$nsCloudServerBuildService.getPresignedUploadUrlObject(uuid.v4());
			const disposition = constants.DISPOSITIONS.PACKAGE_ZIP;
			settings.filesToUpload.push(_.merge({ filePath, disposition }, preSignedUrlData));
			buildFiles = [
				{
					disposition,
					sourceUri: preSignedUrlData.publicDownloadUrl
				}
			];
		}

		for (const fileToUpload of settings.filesToUpload) {
			await this.$nsCloudUploadService.uploadToS3(fileToUpload.filePath, fileToUpload.fileName, fileToUpload.uploadPreSignedUrl);
		}

		this.emitStepChanged(settings.cloudOperationId, constants.BUILD_STEP_NAME.UPLOAD, constants.BUILD_STEP_PROGRESS.END);
		const runtimeVersion = await this.$nsCloudVersionService.getProjectRuntimeVersion(settings.projectSettings.projectDir, settings.platform);
		const cliVersion = await this.$nsCloudVersionService.getCliVersion(runtimeVersion);
		const sanitizedProjectName = this.$projectHelper.sanitizeName(settings.projectSettings.projectName);
		const workflow: IWorkflowRequestData = settings.projectSettings.workflowName && settings.projectSettings.workflowUrl && {
			workflowName: settings.projectSettings.workflowName,
			workflowUrl: settings.projectSettings.workflowUrl
		};

		/** Although the nativescript-cloud is an extension that is used only with nativescript projects,
		 * current implementation of the builder daemon will not add default framework. This breaks tooling when incremental build is
		 * performed. Passing the framework=tns here is more consistent that adding conditional
		 * behavior in the tooling.
		 */
		const result: IBuildRequestData = {
			cloudOperationId: settings.cloudOperationId,
			accountId: settings.accountId,
			properties: {
				buildConfiguration: settings.buildConfiguration,
				sharedCloud: settings.projectSettings.sharedCloud,
				platform: settings.platform,
				appIdentifier: settings.projectSettings.projectId,
				frameworkVersion: cliVersion,
				runtimeVersion: runtimeVersion,
				sessionKey: settings.buildCredentials.sessionKey, // TODO: remove this parameter after we deploy our new server.
				templateAppName: sanitizedProjectName,
				projectName: sanitizedProjectName,
				framework: "tns",
				flavorId: settings.projectSettings.flavorId,
				additionalCliFlags: settings.additionalCliFlags,
				useIncrementalBuild: !settings.projectSettings.clean,
				userEmail: this.$nsCloudUserService.getUser().email,
				workspacePassword: await this.$nsCloudEncryptionService.getWorkspacePassword(settings.projectSettings)
			},
			workflow,
			targets: [],
			buildFiles
		};

		const cloudConfigData = this.$nsCloudConfigurationService.getCloudConfigurationData();
		if (cloudConfigData && cloudConfigData.machineId) {
			result.machineId = cloudConfigData.machineId;
		}

		return result;
	}

	private getBuildResultUrl(buildResult: ICloudOperationResult): string {
		// We expect only one buildResult - .ipa, .apk ...
		return this.getServerResults(buildResult)[0].fullPath;
	}

	protected getServerResults(buildResult: ICloudOperationResult): IServerItem[] {
		const result = _.find(buildResult.buildItems, b => b.disposition === constants.DISPOSITIONS.BUILD_RESULT);

		if (!result) {
			this.$errors.failWithoutHelp("No item with disposition BuildResult found in the build result items.");
		}

		return [result];
	}

	private async downloadServerResult(cloudOperationId: string, buildResult: ICloudOperationResult, buildOutputOptions: IOutputDirectoryOptions): Promise<string> {
		this.emitStepChanged(cloudOperationId, constants.BUILD_STEP_NAME.DOWNLOAD, constants.BUILD_STEP_PROGRESS.START);
		const targetFileNames = await super.downloadServerResults(buildResult, buildOutputOptions);
		this.emitStepChanged(cloudOperationId, constants.BUILD_STEP_NAME.DOWNLOAD, constants.BUILD_STEP_PROGRESS.END);
		return targetFileNames[0];
	}

	private async getImageData(buildResultUrl: string, options: IItmsPlistOptions): Promise<string> {
		if (options.pathToProvision) {
			const provisionData = this.$nsCloudBuildHelper.getMobileProvisionData(options.pathToProvision);
			const provisionType = this.$nsCloudBuildHelper.getProvisionType(provisionData);
			if (provisionType !== constants.PROVISION_TYPES.ADHOC) {
				return null;
			}

			const preSignedUrlData = await this.$nsCloudServerBuildService.getPresignedUploadUrlObject(uuid.v4());
			await this.$nsCloudUploadService.uploadToS3(this.$nsCloudItmsServicesPlistHelper.createPlistContent(options), preSignedUrlData.fileName, preSignedUrlData.uploadPreSignedUrl);
			return this.$qr.generateDataUri(`itms-services://?action=download-manifest&amp;url=${escape(preSignedUrlData.publicDownloadUrl)}`);
		}

		return this.$qr.generateDataUri(buildResultUrl);
	}

	private emitStepChanged(cloudOperationId: string, step: string, progress: number): void {
		const buildStep: IBuildStep = { cloudOperationId: cloudOperationId, step, progress };
		this.emit(constants.CLOUD_BUILD_EVENT_NAMES.STEP_CHANGED, buildStep);
	}
}

$injector.register("nsCloudBuildService", CloudBuildService);
