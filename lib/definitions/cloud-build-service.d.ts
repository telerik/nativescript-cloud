/**
 * Describes the result of a cloud build operation.
 */
interface IBuildResultData {
	/**
	 * The ID of the build.
	 */
	buildId: string;

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
 * Describes build step.
 */
interface IBuildStep {
	/**
	 * The ID of the build.
	 */
	buildId: string;

	/**
	 * The name of the step.
	 */
	step: string;

	/**
	 * The progress of the step in percents. The value will be between 0 and 100.
	 */
	progress: number;
}

interface IBuildError extends Error {
	buildId: string;
}

interface IBuildLog {
	buildId: string;
	data: string;
	pipe: string;
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

	/**
	 * Returns the path to the directory where the build output may be found.
	 * @param {ICloudBuildOutputDirectoryOptions} options Options that are used to determine the build output directory.
	 * @returns {string} The build output directory.
	 */
	getBuildOutputDirectory(options: ICloudBuildOutputDirectoryOptions): string;
}

/**
 * Options that can be used to construct itms-services plist.
 */
interface IItmsPlistOptions {
	/**
	 * The path to the mobileprovision file on the file system.
	 */
	pathToProvision?: string;

	/**
	 * The url pointing the .ipa file which is to be installed on the device by itms-services.
	 */
	url: string;

	/**
	 * The aforementioned .ipa file's application identifier
	 */
	projectId: string;

	/**
	 * The aforementioned .ipa file's application's display name
	 */
	projectName: string;
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

	/**
	 *  Whether to clean & build. By default incremental build without clean is performed.
	 */
	clean: boolean;
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

/**
 * Describes the status of the build.
 */
interface IBuildStatus {
	/**
	 * The build status.
	 */
	status: string;
}

/**
 * Describes options that can be passed in order to specify the exact location of the built package.
 */
interface ICloudBuildOutputDirectoryOptions {
	/**
	 * Android or iOS
	 */
	platform: string;

	/**
	 * Directory where the project is located.
	 */
	projectDir: string;

	/**
	 * Whether the build is for emulator or not.
	 */
	emulator?: boolean;
}

/**
 * Describes the result from the build.
 */
interface IBuildResult {
	errors: string[];
	code: number;
	stdout: string;
	stderr: string;
	buildItems: IBuildItem[];
}

interface IBuildItemBase {
	disposition: string;
	filename: string;
	fullPath: string;
}

interface IBuildItem extends IBuildItemBase {
	platform: string;
	extension: string;
}
