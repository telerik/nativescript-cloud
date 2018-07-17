import * as semver from "semver";

export class ApplicationService implements IApplicationService {
	constructor(private $platformService: IPlatformService,
		private $projectDataService: IProjectDataService,
		private $devicesService: Mobile.IDevicesService,
		private $projectChangesService: IProjectChangesService,
		private $staticConfig: IStaticConfig,
		private $logger: ILogger) {
	}

	public async shouldBuild(config: IApplicationBuildConfig): Promise<boolean> {
		const projectData = this.$projectDataService.getProjectData(config.projectDir);
		config.release = config.release === undefined ? false : config.release;
		config.bundle = config.bundle === undefined ? false : config.bundle;

		const cliVersion = this.$staticConfig.version;
		const shouldUseOldCheckForChanges = semver.valid(cliVersion) && semver.lt(cliVersion, semver.prerelease(cliVersion) ? "4.2.0-2018-07-17-11996" : "4.2.0");
		if (shouldUseOldCheckForChanges) {
			// Backwards compatibility as checkForChanges method has different args in old versions
			this.$logger.trace(`Using old checkForChanges as CLI version is ${cliVersion}.`);
			await (<any>this.$projectChangesService).checkForChanges(config.platform, projectData, config);
		} else {
			await this.$projectChangesService.checkForChanges({
				platform: config.platform,
				projectData,
				projectChangesOptions: config
			});
		}

		return this.$platformService.shouldBuild(config.platform, projectData, config, config.outputPath);
	}

	public async shouldInstall(config: IApplicationInstallConfig): Promise<boolean> {
		const projectData = this.$projectDataService.getProjectData(config.projectDir);
		const device = await this.$devicesService.getDevice(config.deviceIdentifier);
		return this.$platformService.shouldInstall(device, projectData, config, config.outputPath);
	}
}

$injector.register("nsCloudApplicationService", ApplicationService);
