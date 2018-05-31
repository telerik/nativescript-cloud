import { getRandomString } from "../helpers";

export class CloudEncryptionService implements ICloudEncryptionService {
	private static readonly NS_CLOUD_ENCRYPTION_SETTINGS: string = "nsCloudEncryptionsSettings";
	private static readonly IMAGE_PASSWORD_LENGTH: number = 64;

	constructor(private $userSettingsService: IUserSettingsService,
		private $nsCloudUserService: IUserService,
		private $nsCloudHashService: IHashService) { }

	public async getWorkspacePassword(projectSettings: INSCloudProjectSettings): Promise<string> {
		const propertyName = this.$nsCloudHashService.getHash(`${this.$nsCloudUserService.getUser().email}_${projectSettings.projectId}`);
		const imageSettings = await this.getNsCloudImageSettings();
		let value = imageSettings[propertyName];
		if (!value) {
			value = this.generatePassword();
			await this.setImageSetting(propertyName, value);
		}

		return value;
	}

	private generatePassword(): string {
		return getRandomString(CloudEncryptionService.IMAGE_PASSWORD_LENGTH);
	}

	private async getNsCloudImageSettings(): Promise<IDictionary<string>> {
		const settings = await this.$userSettingsService.getSettingValue<IDictionary<string>>(CloudEncryptionService.NS_CLOUD_ENCRYPTION_SETTINGS) || {};
		return settings;
	}

	private async setImageSetting(prop: string, value: string): Promise<void> {
		const imageSettings = await this.getNsCloudImageSettings();
		imageSettings[prop] = value;
		await this.$userSettingsService.saveSetting(CloudEncryptionService.NS_CLOUD_ENCRYPTION_SETTINGS, imageSettings);
	}
}

$injector.register("nsCloudEncryptionService", CloudEncryptionService);
