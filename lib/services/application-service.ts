import * as semver from "semver";

export class ApplicationService implements IApplicationService {
	private shouldUseOldCheckForChanges = true;

	constructor(private $nsCloudPlatformService: ICloudPlatformService,
		private $projectDataService: IProjectDataService,
		private $devicesService: Mobile.IDevicesService,
		private $projectChangesService: IProjectChangesService,
		private $staticConfig: IStaticConfig,
		private $injector: IInjector) {
			const cliVersion = this.$staticConfig.version;
			this.shouldUseOldCheckForChanges = semver.valid(cliVersion) && semver.lt(cliVersion, semver.prerelease(cliVersion) ? "5.4.0-2019-05-16-13277" : "6.0.0");
	}

	public async shouldBuild(config: IApplicationBuildConfig): Promise<boolean> {
		const projectData = this.$projectDataService.getProjectData(config.projectDir);
		config.release = config.release === undefined ? false : config.release;
		config.bundle = config.bundle === undefined ? false : config.bundle;

		if (this.shouldUseOldCheckForChanges) {
			await (<any>this.$projectChangesService).checkForChanges({
				platform: config.platform,
				projectData,
				projectChangesOptions: config
			});
		} else {
			const platformsDataService = this.$injector.resolve("platformsDataService");
			const platformData = platformsDataService.getPlatformData(config.platform, projectData);

			const prepareDataService = this.$injector.resolve("prepareDataService");
			const prepareData = prepareDataService.getPrepareData(projectData.projectDir, config.platform, config);
			await this.$projectChangesService.checkForChanges(platformData, projectData, prepareData);
		}

		return this.$nsCloudPlatformService.shouldBuild(config, projectData);
	}

	public async shouldInstall(config: IApplicationInstallConfig): Promise<boolean> {
		const projectData = this.$projectDataService.getProjectData(config.projectDir);
		const device = await this.$devicesService.getDevice(config.deviceIdentifier);
		return this.$nsCloudPlatformService.shouldInstall(config, projectData, device);
	}
}

$injector.register("nsCloudApplicationService", ApplicationService);
