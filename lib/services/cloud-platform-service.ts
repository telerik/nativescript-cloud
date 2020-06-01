import * as semver from "semver";
import * as constants from "../constants";

export class CloudPlatformService implements ICloudPlatformService {
	private shouldUseOldPlatformService: boolean;

	constructor(
		private $injector: IInjector,
		private $staticConfig: IStaticConfig
	) {
		const cliVersion = this.$staticConfig.version;
		this.shouldUseOldPlatformService = semver.valid(cliVersion) && semver.lt(cliVersion, semver.prerelease(cliVersion) ? "5.4.0-2019-05-16-13277" : "6.0.0");
	}

	public get $nsCloudBuildCommandHelper(): IBuildCommandHelper {
		return this.$injector.resolve("nsCloudBuildCommandHelper");
	}

	public async shouldBuild(config: IApplicationBuildConfig, projectData: IProjectData): Promise<boolean> {
		(<INSCloudGlobal>global).showErrorForStoppedCloudBuilds();
		if (this.shouldUseOldPlatformService) {
			const $platformService = this.$injector.resolve("platformService");
			return $platformService.shouldBuild(config.platform, projectData, config, config.outputPath);
		}

		const $buildController = this.$injector.resolve("buildController");
		return $buildController.shouldBuild(config);
	}

	public async shouldInstall(config: IApplicationInstallConfig, projectData: IProjectData, device: Mobile.IDevice): Promise<boolean> {
		(<INSCloudGlobal>global).showErrorForStoppedCloudBuilds();
		if (this.shouldUseOldPlatformService) {
			const $platformService = this.$injector.resolve("platformService");
			return $platformService.shouldInstall(device, projectData, config, config.outputPath);
		}

		const $deviceInstallAppService = this.$injector.resolve("deviceInstallAppService");
		return $deviceInstallAppService.shouldInstall(device, config);
	}

	public async deployPlatform(platform: string, outputDirectoryPath: string): Promise<void> {
		(<INSCloudGlobal>global).showErrorForStoppedCloudBuilds();
		const $deployCommandHelper = this.$injector.resolve("deployCommandHelper");

		if (this.shouldUseOldPlatformService) {
			const deployPlatformInfo = $deployCommandHelper.getDeployPlatformInfo(platform);
			deployPlatformInfo.buildPlatform = this.$nsCloudBuildCommandHelper.buildPlatform.bind(this.$nsCloudBuildCommandHelper);
			deployPlatformInfo.outputPath = outputDirectoryPath;
			deployPlatformInfo.nativePrepare = { skipNativePrepare: true };

			const platformService = this.$injector.resolve("platformService");
			return platformService.deployPlatform(deployPlatformInfo);
		}

		return $deployCommandHelper.deploy(platform, {
			getOutputDirectory: () => outputDirectoryPath,
			buildPlatform: this.$nsCloudBuildCommandHelper.buildPlatform.bind(this.$nsCloudBuildCommandHelper),
			skipNativePrepare: true
		});
	}

	public async saveBuildInfoFile(projectDir: string, buildInfoFileDirname: string, platformData: IPlatformData): Promise<void> {
		(<INSCloudGlobal>global).showErrorForStoppedCloudBuilds();
		if (this.shouldUseOldPlatformService) {
			const $platformService = this.$injector.resolve("platformService");
			return $platformService.saveBuildInfoFile(platformData.normalizedPlatformName.toLowerCase(), projectDir, buildInfoFileDirname);
		}

		const $buildInfoFileService = this.$injector.resolve("buildInfoFileService");
		return $buildInfoFileService.saveLocalBuildInfo(platformData, buildInfoFileDirname);
	}

	public async preparePlatform(projectSettings: INSCloudProjectSettings,
		platform: string,
		buildConfiguration: string,
		projectData: IProjectData,
		provision: string,
		mobileProvisionData: any): Promise<void> {
		(<INSCloudGlobal>global).showErrorForStoppedCloudBuilds();
		if (this.shouldUseOldPlatformService) {
			const appFilesUpdaterOptions = {
				bundle: projectSettings.bundle,
				useHotModuleReload: projectSettings.useHotModuleReload,
				release: buildConfiguration && buildConfiguration.toLowerCase() === constants.CLOUD_BUILD_CONFIGURATIONS.RELEASE.toLowerCase()
			};

			const config: any = {
				provision,
				mobileProvisionData,
				sdk: null,
				frameworkPath: null,
				ignoreScripts: false,
				teamId: undefined
			};

			const $platformService = this.$injector.resolve("platformService");
			return $platformService.preparePlatform({
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

		const $prepareController = this.$injector.resolve("prepareController");
		return $prepareController.prepare({
			projectDir: projectData.projectDir,
			platform,
			useHotModuleReload: projectSettings.useHotModuleReload,
			release: buildConfiguration && buildConfiguration.toLowerCase() === constants.CLOUD_BUILD_CONFIGURATIONS.RELEASE.toLowerCase(),
			provision,
			mobileProvisionData,
			teamId: null,
			env: projectSettings.env,
			nativePrepare: { skipNativePrepare: true }
		});
	}
}

$injector.register("nsCloudPlatformService", CloudPlatformService);
