export class AssetGenerationService implements IAssetGenerationService {
	constructor(private $logger: ILogger,
		private $uploadService: IUploadService) { }

	public async generateIcons({ imagePath }: IAssetGeneratorData) {
		this.$logger.trace("generateIcons");

		const imageLocation = await this.$uploadService.uploadToS3(imagePath);

		return imageLocation;
	}

	public async generateSplashScreens() {
		this.$logger.trace("generateSplashScreens");
	}
}

$injector.register("assetGenerationService", AssetGenerationService);
