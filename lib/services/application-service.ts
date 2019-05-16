export class ApplicationService implements IApplicationService {
	constructor(private $nsCloudPlatformService: ICloudPlatformService,
		private $projectDataService: IProjectDataService,
		private $devicesService: Mobile.IDevicesService,
		private $projectChangesService: IProjectChangesService) {
	}

	public async shouldBuild(config: IApplicationBuildConfig): Promise<boolean> {
		const projectData = this.$projectDataService.getProjectData(config.projectDir);
		config.release = config.release === undefined ? false : config.release;
		config.bundle = config.bundle === undefined ? false : config.bundle;

		await this.$projectChangesService.checkForChanges({
			platform: config.platform,
			projectData,
			projectChangesOptions: config
		});

		return this.$nsCloudPlatformService.shouldBuild(config, projectData);
	}

	public async shouldInstall(config: IApplicationInstallConfig): Promise<boolean> {
		const projectData = this.$projectDataService.getProjectData(config.projectDir);
		const device = await this.$devicesService.getDevice(config.deviceIdentifier);
		return this.$nsCloudPlatformService.shouldInstall(config, projectData, device);
	}
}

$injector.register("nsCloudApplicationService", ApplicationService);
