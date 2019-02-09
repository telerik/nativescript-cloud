/**
 * Describes the result of a server operation.
 */
interface IServerResultData extends IBuildId, ICloudOperationId {
	/**
	 * All data printed to the stderr during server operation.
	 */
	stderr: string;

	/**
	 * All data printed to the stdout during server operation.
	 */
	stdout: string;
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
 * Describes the result from server operation.
 */
interface IServerResult {
	errors: string;
	code: number;
	stdout: string;
	stderr: string;
	data: any;
}

/**
 * Describes the result from build server operation.
 */
interface ICloudOperationResult extends IServerResult {
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

interface IServerItem extends IServerItemBase, IPlatform {
	extension: string;
}

/**
 * Defines common operations for server operation in the cloud.
 */
interface ICloudOperationService extends NodeJS.EventEmitter {
	/**
	 * Returns the path to the directory where the server request output may be found.
	 * @param {IOutputDirectoryOptions} options Options that are used to determine the build output directory.
	 * @returns {string} The build output directory.
	 */
	getServerOperationOutputDirectory(options: IOutputDirectoryOptions): string;

	/**
	 * Sends message to the provided cloud operation.
	 * @param {ICloudOperationMessage} message The message which will be sent to the cloud operation.
	 */
	sendCloudMessage(message: ICloudOperationMessage<any>): Promise<void>;
}

interface ICloudOperationExecutionOptions {
	silent: boolean;
}
