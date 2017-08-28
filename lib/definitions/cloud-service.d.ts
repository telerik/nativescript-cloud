/**
 * Describes the result of a server operation.
 */
interface IServerResultData {
	/**
	 * The ID of the operation - usually named buildId due to initial implementation that is related to other repos.
	 */
	buildId: string;

	/**
	 * All data printed to the stderr during server operation.
	 */
	stderr: string;

	/**
	 * All data printed to the stdout during server operation.
	 */
	stdout: string;

	/**
	 * The full ordered output - combination for stderr and stdout, but ordered in correct timeline.
	 */
	fullOutput: string;
}

/**
 * Describes the status of the server operation.
 */
interface IServerStatus {
	/**
	 * The status of the server operation.
	 */
	status: string;
}

/**
 * Describes options that can be passed in order to specify the exact location of the built package.
 */
interface ICloudServerOutputDirectoryOptions {
	/**
	 * Android or iOS - currently only iOS implementation is available
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
 * Describes the result from the server operation.
 */
interface IServerResult {
	errors: string[];
	code: number;
	stdout: string;
	stderr: string;
	/**
	 * Items produced after execution of server command. Could be empty.
	 * Naming is due to initial implementation that is related to other repos.
	 */
	buildItems: IServerItem[];
}

interface IServerItemBase {
	disposition: string;
	filename: string;
	fullPath: string;
}

interface IServerItem extends IServerItemBase {
	platform: string;
	extension: string;
}
/**
 * Defines common operations for server operation in the cloud.
 */
interface ICloudOperationService {
	/**
	 * Returns the path to the directory where the build output may be found.
	 * @param {ICloudServerOutputDirectoryOptions} options Options that are used to determine the build output directory.
	 * @returns {string} The build output directory.
	 */
	getServerOperationOutputDirectory(options: ICloudServerOutputDirectoryOptions): string;
}
