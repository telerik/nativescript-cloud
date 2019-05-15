import { getRandomString } from "../helpers";

export class CloudEncryptionService implements ICloudEncryptionService {
	private static readonly NS_CLOUD_ENCRYPTION_SETTINGS: string = "nsCloudEncryptionSettings";
	private static readonly IMAGE_PASSWORD_LENGTH: number = 64;

	constructor(private $nsCloudEncryptionSettingsService: IUserSettingsService,
		private $nsCloudUserService: IUserService,
		private $nsCloudHashService: IHashService) {
	}

	public async getWorkspacePassword(projectSettings: INSCloudProjectSettings): Promise<string> {
		const propertyName = this.$nsCloudHashService.getHash(`${this.$nsCloudUserService.getUser().email}_${projectSettings.projectId}`);
		const imageSettings = await this.getNsCloudEncryptionSettings();
		let value = imageSettings[propertyName];
		if (!value) {
			value = this.generatePassword();
			await this.setEncryptionSetting(propertyName, value);
		}

		return value;
	}

	private generatePassword(): string {
		return getRandomString(CloudEncryptionService.IMAGE_PASSWORD_LENGTH);
	}

	private async getNsCloudEncryptionSettings(): Promise<IDictionary<string>> {
		const settings = await this.$nsCloudEncryptionSettingsService.getSettingValue<IDictionary<string>>(CloudEncryptionService.NS_CLOUD_ENCRYPTION_SETTINGS) || {};
		return settings;
	}

	private async setEncryptionSetting(prop: string, value: string): Promise<void> {
		const imageSettings = await this.getNsCloudEncryptionSettings();
		imageSettings[prop] = value;
		await this.$nsCloudEncryptionSettingsService.saveSetting(CloudEncryptionService.NS_CLOUD_ENCRYPTION_SETTINGS, imageSettings);
	}
}

$injector.register("nsCloudEncryptionService", CloudEncryptionService);
