import * as path from "path";
import { EventEmitter } from "events";
import promiseRetry = require("promise-retry");

export abstract class CloudService extends EventEmitter {
	private static OPERATION_STATUS_CHECK_INTERVAL = 1500;
	private static OPERATION_STATUS_CHECK_RETRY_COUNT = 8;
	private static OPERATION_COMPLETE_STATUS = "Success";
	private static OPERATION_FAILED_STATUS = "Failed";
	// TODO: Remove after 10.05.2018
	private static OPERATION_IN_PROGRESS_STATUS_OLD = "Building";
	private static OPERATION_IN_PROGRESS_STATUS = "InProgress";

	protected outputCursorPosition: number;
	protected abstract failedToStartError: string;
	protected abstract failedError: string;
	protected abstract getServerResults(serverResult: IBuildServerResult): IServerItem[];
	protected abstract getServerLogs(logsUrl: string, buildId: string): Promise<void>;

	public abstract getServerOperationOutputDirectory(options: IOutputDirectoryOptions): string;

	constructor(protected $fs: IFileSystem,
		protected $httpClient: Server.IHttpClient,
		protected $logger: ILogger) {
		super();
	}

	protected async getObjectFromS3File<T>(pathToFile: string): Promise<T> {
		return JSON.parse(await this.getContentOfS3File(pathToFile));
	}

	protected async getContentOfS3File(pathToFile: string): Promise<string> {
		return (await this.$httpClient.httpRequest(pathToFile)).body;
	}

	protected async waitForServerOperationToFinish(operationId: string, serverInformation: IServerResponse): Promise<void> {
		const promiseRetryOptions = {
			retries: CloudService.OPERATION_STATUS_CHECK_RETRY_COUNT,
			minTimeout: CloudService.OPERATION_STATUS_CHECK_INTERVAL
		};
		return promiseRetry((retry, attempt) => {
			return new Promise<IServerStatus>(async (resolve, reject) => {
				try {
					resolve(await this.getObjectFromS3File<IServerStatus>(serverInformation.statusUrl));
				} catch (err) {
					this.$logger.trace(err);
					reject(new Error(this.failedToStartError));
				}

			}).catch(retry);
		}, promiseRetryOptions)
			.then((serverStatus: IServerStatus) => {
				return new Promise<void>((resolve, reject) => {
					this.outputCursorPosition = 0;
					const serverIntervalId = setInterval(async () => {
						if (serverStatus.status === CloudService.OPERATION_COMPLETE_STATUS) {
							await this.getServerLogs(serverInformation.outputUrl, operationId);
							clearInterval(serverIntervalId);
							return resolve();
						}

						if (serverStatus.status === CloudService.OPERATION_FAILED_STATUS) {
							await this.getServerLogs(serverInformation.outputUrl, operationId);
							clearInterval(serverIntervalId);
							return reject(new Error(this.failedError));
						}

						if (serverStatus.status === CloudService.OPERATION_IN_PROGRESS_STATUS_OLD ||
							serverStatus.status === CloudService.OPERATION_IN_PROGRESS_STATUS) {
							await this.getServerLogs(serverInformation.outputUrl, operationId);
						}

						serverStatus = await this.getObjectFromS3File<IServerStatus>(serverInformation.statusUrl);
					}, CloudService.OPERATION_STATUS_CHECK_INTERVAL);
				});
			});
	}

	protected async downloadServerResults(serverResult: IBuildServerResult, serverOutputOptions: IOutputDirectoryOptions): Promise<string[]> {
		const destinationDir = this.getServerOperationOutputDirectory(serverOutputOptions);
		this.$fs.ensureDirectoryExists(destinationDir);

		const serverResultObjs = this.getServerResults(serverResult);

		let targetFileNames: string[] = [];
		for (const serverResultObj of serverResultObjs) {
			const targetFileName = path.join(destinationDir, serverResultObj.filename);
			targetFileNames.push(targetFileName);
			const targetFile = this.$fs.createWriteStream(targetFileName);

			// Download the output file.
			await this.$httpClient.httpRequest({
				url: serverResultObj.fullPath,
				pipeTo: targetFile
			});
		}

		return targetFileNames;
	}
}
