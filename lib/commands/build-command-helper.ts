import * as path from "path";
import { CLOUD_BUILD_CONFIGURATIONS } from "../constants";

export class BuildCommandHelper implements IBuildCommandHelper {
	private get $localBuildService(): ILocalBuildService {
		return this.$injector.resolve<ILocalBuildService>("localBuildService");
	}

	constructor(private $nsCloudBuildService: ICloudBuildService,
		private $errors: IErrors,
		private $logger: ILogger,
		private $prompter: IPrompter,
		private $mobileHelper: Mobile.IMobileHelper,
		private $projectData: IProjectData,
		private $injector: IInjector,
		private $options: ICloudOptions,
		private $fs: IFileSystem) {
		this.$projectData.initializeProjectData();
	}

	public async buildPlatform(platform: string, buildConfig: IBuildConfig, projectData: IProjectData): Promise<string> {
		const buildData = this.getCloudBuildData(platform);
		buildData.iOSBuildData.buildForDevice = buildConfig.buildForDevice;
		const buildResultData = await this.$nsCloudBuildService.build(buildData.projectSettings,
			buildData.platform, buildData.buildConfiguration,
			this.$options.accountId,
			buildData.androidBuildData,
			buildData.iOSBuildData);
		return buildResultData.outputFilePath;
	}

	public getCloudBuildData(platformArg: string): IBuildData {
		const platform = this.$mobileHelper.validatePlatformName(platformArg);
		this.$logger.info(`Executing cloud build with platform: ${platform}.`);
		const nativescriptData = this.$fs.readJson(path.join(this.$projectData.projectDir, "package.json")).nativescript;
		let pathToCertificate = "";
		if (this.$mobileHelper.isAndroidPlatform(platform)) {
			pathToCertificate = this.$options.keyStorePath ? path.resolve(this.$options.keyStorePath) : "";
		} else if (this.$mobileHelper.isiOSPlatform(platform)) {
			pathToCertificate = this.$options.certificate ? path.resolve(this.$options.certificate) : "";
		} else {
			this.$errors.failWithoutHelp(`Currently only ${this.$mobileHelper.platformNames.join(' ')} platforms are supported.`);
		}

		const pathToProvision = this.$options.provision ? path.resolve(this.$options.provision) : "";
		const projectSettings: INSCloudProjectSettings = {
			nativescriptData,
			projectDir: this.$projectData.projectDir,
			projectId: this.$projectData.projectId,
			projectName: this.$projectData.projectName,
			bundle: !!this.$options.bundle,
			sharedCloud: this.$options.sharedCloud,
			flavorId: this.$options.vmTemplateName,
			workflowName: this.$options.workflow && this.$options.workflow.name,
			workflowUrl: this.$options.workflow && this.$options.workflow.url,
			clean: this.$options.clean,
			env: this.$options.env
		};
		const buildConfiguration = this.$options.release ? CLOUD_BUILD_CONFIGURATIONS.RELEASE : CLOUD_BUILD_CONFIGURATIONS.DEBUG;
		return {
			projectSettings,
			platform,
			buildConfiguration,
			androidBuildData: {
				pathToCertificate,
				certificatePassword: this.$options.keyStorePassword
			},
			iOSBuildData: {
				pathToCertificate,
				certificatePassword: this.$options.certificatePassword,
				pathToProvision,
				buildForDevice: !this.$options.emulator
			}
		};
	}

	public async getAppleCredentials(args: string[]): Promise<ICredentials> {
		let username = args[0];
		let password = args[1];

		if (!username) {
			username = await this.$prompter.getString("Apple ID", { allowEmpty: false });
		}

		if (!password) {
			password = await this.$prompter.getPassword("Apple ID password");
		}

		return { username, password };
	}

	public async buildForPublishingPlatform(platformArg: string): Promise<string> {
		let packagePath: string;
		const platform = this.$mobileHelper.validatePlatformName(platformArg);
		if (this.$options.local) {
			packagePath = await this.$localBuildService.build(platform, {
				release: true,
				buildForDevice: true,
				clean: this.$options.clean,
				teamId: this.$options.teamId,
				bundle: !!this.$options.bundle,
				device: this.$options.device,
				projectDir: this.$options.path,
				provision: this.$options.provision,
				keyStoreAlias: this.$options.keyStoreAlias,
				keyStoreAliasPassword: this.$options.keyStoreAliasPassword,
				keyStorePassword: this.$options.keyStorePassword,
				keyStorePath: this.$options.keyStorePath,
				env: this.$options.env
			}, this.$options.platformTemplate);
		} else {
			const buildData = this.getCloudBuildData(platform);
			buildData.buildConfiguration = CLOUD_BUILD_CONFIGURATIONS.RELEASE;
			packagePath = (await this.$nsCloudBuildService.build(buildData.projectSettings,
				buildData.platform, buildData.buildConfiguration,
				this.$options.accountId,
				buildData.androidBuildData,
				buildData.iOSBuildData)).qrData.originalUrl;
		}

		return packagePath;
	}
}

$injector.register("nsCloudBuildCommandHelper", BuildCommandHelper);
