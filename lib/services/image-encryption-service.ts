import { getRandomString } from "../helpers";

export class ImageEncryptionService implements IImageEncryptionService {
	private static readonly NS_CLOUD_MAC_IMAGE_SETTINGS: string = "nsCloudMacImageSettings";
	private static readonly IMAGE_PASSWORD_LENGTH: number = 512;

	constructor(private $userSettingsService: IUserSettingsService,
		private $nsCloudUserService: IUserService,
		private $nsCloudHashService: IHashService) { }

	public async getImagePassword(projectSettings: INSCloudProjectSettings): Promise<string> {
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
		return getRandomString(ImageEncryptionService.IMAGE_PASSWORD_LENGTH);
	}

	private async getNsCloudImageSettings(): Promise<IDictionary<string>> {
		const settings = await this.$userSettingsService.getSettingValue<IDictionary<string>>(ImageEncryptionService.NS_CLOUD_MAC_IMAGE_SETTINGS) || {};
		return settings;
	}

	private async setImageSetting(prop: string, value: string): Promise<void> {
		const imageSettings = await this.getNsCloudImageSettings();
		imageSettings[prop] = value;
		await this.$userSettingsService.saveSetting(ImageEncryptionService.NS_CLOUD_MAC_IMAGE_SETTINGS, imageSettings);
	}
}

$injector.register("nsCloudImageEncryptionService", ImageEncryptionService);
