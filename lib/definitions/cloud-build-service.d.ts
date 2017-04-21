/**
 * Describes the result of a cloud build operation.
 */
interface IBuildResultData {
	/**
	 * All data printed to the stderr during cloud build operation.
	 */
	stderr: string;

	/**
	 * All data printed to the stdout during cloud build operation.
	 */
	stdout: string;

	/**
	 * The full ordered output - combination for stderr and stdout, but ordered in correct timeline.
	 */
	fullOutput: string;

	/**
	 * Path to the downloaded result of the build operation - .apk, .ipa...
	 */
	outputFilePath: string;

	/**
	 * Data required for generation of a QR code from the build result.
	 */
	qrData: IQrData;
}

/**
 * Describes the data used for generating QR code from cloud build result.
 */
interface IQrData {
	/**
	 * The original URL (to S3), where built package is located.
	 */
	originalUrl: string;

	/**
	 * Base64 encoded data used for generating QR code image.
	 */
	imageData: string;
}

/**
 * Defines operations for building a project in the cloud.
 */
interface ICloudBuildService {
	/**
	 * Builds the specified application in the cloud and returns information about the whole build process.
	 * @param {IProjectSettings} projectSettings Describes the current project - project dir, application identifier, name and nativescript data.
	 * @param {string} platform The mobile platform for which the application should be built: Android or iOS.
	 * @param {string} buildConfiguration The build configuration - Debug or Release.
	 * @param {IAndroidBuildData} androidBuildData Android speicific information for the build.
	 * @param {IIOSBuildData} iOSBuildData iOS speicific information for the build.
	 * @returns {Promise<IBuildResultData>} Information about the build process. It is returned only on successfull build. In case the build fails, the Promise is rejected with the server information.
	 */
	build(projectSettings: IProjectSettings,
		platform: string, buildConfiguration: string,
		androidBuildData?: IAndroidBuildData,
		iOSBuildData?: IIOSBuildData): Promise<IBuildResultData>;

	/**
	 * Validates the build properties for specified platform (Android or iOS).
	 * The result promise is rejected with the error found. In case everything is correct, the promise is resolved.
	 * @param {string} platform The mobile platform for which the application should be built: Android or iOS.
	 * @param {string} buildConfiguration The build configuration - Debug or Release.
	 * @param {string} projectId Application identifier of the project.
	 * @param {IAndroidBuildData} androidBuildData Android speicific information for the build.
	 * @param {IIOSBuildData} iOSBuildData iOS speicific information for the build.
	 * @returns {Promise<void>}
	 */
	validateBuildProperties(platform: string,
		buildConfiguration: string,
		projectId: string,
		androidBuildData?: IAndroidBuildData,
		iOSBuildData?: IIOSBuildData): Promise<void>;
}

/**
 * Describes the project settings required for different operations.
 */
interface IProjectSettings {
	/**
	 * The directory where the project is located. This should be the path to the directory where application's package.json is located.
	 */
	projectDir: string;

	/**
	 * Application identifier.
	 */
	projectId: string;

	/**
	 * Name that will be visible to the users when application is installed on device.
	 */
	projectName: string;

	/**
	 * The value of `nativescript` key from project's package.json.
	 */
	nativescriptData: any;
}

/**
 * Describes specific data required for Android Builds.
 */
interface IAndroidBuildData {
	/**
	 * Path to certificate (.p12 or .keystore), used for code signing the application. Required and used only for release builds.
	 */
	pathToCertificate: string;

	/**
	 * Password of the specified certificate. Required and used only for release builds.
	 */
	certificatePassword: string;
}

/**
 * Describes specific data required for iOS Builds.
 */
interface IIOSBuildData extends IBuildForDevice {
	/**
	 * Path to mobile provision that will be used for current build operation.
	 */
	pathToProvision: string;

	/**
	 * Path to certificate (.p12), used for code signing the application.
	 */
	pathToCertificate: string;

	/**
	 * Password of the specified certificate.
	 */
	certificatePassword: string;

	/**
	 * @optional Device identifier that will be used for validation.
	 * In order to deploy the built application to this device, the identifier should be included in the mobile provision.
	 * In case you pass the deviceIdentifier and it is not included in the specified provision, the operation will fail.
	 */
	deviceIdentifier?: string;
}
