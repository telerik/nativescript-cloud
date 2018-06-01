import { join } from "path";
export class CloudConfigurationService implements ICloudConfigurationService {

	constructor(private $settingsService: ISettingsService,
		private $logger: ILogger,
		private $fs: IFileSystem) { }

	public getCloudConfigurationData(): ICloudConfigurationData {
		const cloudConfigFilePath = join(this.$settingsService.getProfileDir(), "cloud-configuration.json");
		let result = null;
		if (this.$fs.exists(cloudConfigFilePath)) {
			try {
				result = this.$fs.readJson(cloudConfigFilePath);
			} catch (ex) {
				this.$logger.trace(`Failed to parse ${cloudConfigFilePath}. Exceptions is: `, ex);
			}
		}

		return result;
	}
}

$injector.register("nsCloudConfigurationService", CloudConfigurationService);
