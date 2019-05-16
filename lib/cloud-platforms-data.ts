import * as semver from "semver";

export class CloudPlatformsData implements ICloudPlatformsData {
	private shouldUseOldPlatformsData: boolean;

	constructor(
		private $injector: IInjector,
		private $staticConfig: IStaticConfig
	) {
		const cliVersion = this.$staticConfig.version;
		this.shouldUseOldPlatformsData = semver.valid(cliVersion) && semver.lt(cliVersion, semver.prerelease(cliVersion) ? "5.4.0-2019-05-15-13277" : "6.0.0");
	}

	public getPlatformData(platform: string, projectData: IProjectData): IPlatformData {
		if (this.shouldUseOldPlatformsData) {
			const $platformsData = this.$injector.resolve("platformsData");
			return $platformsData.getPlatformData(platform, projectData);
		}

		const $platformsDataService = this.$injector.resolve("platformsDataService");
		return $platformsDataService.getPlatformData(platform, projectData);
	}
}
$injector.register("nsCloudPlatformsData", CloudPlatformsData);
