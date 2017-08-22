interface IAssetGenerationService {
	/**
	 * generateIcons.
	 * @returns {void}
	 */
	generateIcons(assetGeneratorData: IAssetGeneratorData): void;

	/**
	 * generateSplashScreens.
	 * @returns {void}
	 */
	generateSplashScreens(): void;
}

/**
 * IAssetGeneratorData
 */
interface IAssetGeneratorData {
	/**
	 * The path to the image.
	 */
	imagePath: string;

	/**
	 * JSON object, describing the expected generated files.
	 */
	operationsData: any;
}
