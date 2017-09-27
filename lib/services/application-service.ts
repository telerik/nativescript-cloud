export class ApplicationService implements IApplicationService {
	constructor(private $platformService: IPlatformService,
		private $projectDataService: IProjectDataService,
		private $devicesService: Mobile.IDevicesService,
		private $projectChangesService: IProjectChangesService) {
	}

	public async shouldBuild(config: IApplicationBuildConfig): Promise<boolean> {
		const projectData = this.$projectDataService.getProjectData(config.projectDir);
		config.release = config.release === undefined ? false : config.release;
		config.bundle = config.bundle === undefined ? false : config.bundle;
		await this.$projectChangesService.checkForChanges(config.platform, projectData, config);
		return this.$platformService.shouldBuild(config.platform, projectData, config, config.outputPath);
	}

	public async shouldInstall(config: IApplicationInstallConfig): Promise<boolean> {
		const projectData = this.$projectDataService.getProjectData(config.projectDir);
		const device = await this.$devicesService.getDevice(config.deviceIdentifier);
		return this.$platformService.shouldInstall(device, projectData, config.outputPath);
	}
}

$injector.register("applicationService", ApplicationService);
