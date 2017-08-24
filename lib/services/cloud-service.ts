import * as path from "path";
import { EventEmitter } from "events";

export abstract class CloudService extends EventEmitter {
	private static OPERATION_STATUS_CHECK_INTERVAL = 1500;
	private static OPERATION_COMPLETE_STATUS = "Success";
	private static OPERATION_FAILED_STATUS = "Failed";

	protected outputCursorPosition: number;
	protected abstract failedToStartError: string;
	protected abstract failedError: string;
	protected abstract operationInProgressStatus: string;
	protected abstract getServerResults(serverResult: IServerResult): IServerItem[];
	protected abstract getServerLogs(logsUrl: string, buildId: string): Promise<void>;

	public abstract getServerOperationOutputDirectory(options: ICloudServerOutputDirectoryOptions): string;

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

	protected waitForServerOperationToFinish(buildId: string, serverInformation: IServerResponse): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			this.outputCursorPosition = 0;
			let hasCheckedForServerStatus = false;
			const serverIntervalId = setInterval(async () => {
				let serverStatus: IServerStatus;
				try {
					serverStatus = await this.getObjectFromS3File<IServerStatus>(serverInformation.statusUrl);
				} catch (err) {
					this.$logger.trace(err);
				}

				if (!hasCheckedForServerStatus) {
					hasCheckedForServerStatus = true;
				} else if (!serverStatus) {
					// We will get here if there is no server status twice in a row.
					clearInterval(serverIntervalId);
					return reject(new Error(this.failedToStartError));
				}

				if (!serverStatus) {
					return;
				}

				if (serverStatus.status === CloudService.OPERATION_COMPLETE_STATUS) {
					clearInterval(serverIntervalId);
					await this.getServerLogs(serverInformation.outputUrl, buildId);

					return resolve();
				}

				if (serverStatus.status === CloudService.OPERATION_FAILED_STATUS) {
					clearInterval(serverIntervalId);
					await this.getServerLogs(serverInformation.outputUrl, buildId);

					return reject(new Error(this.failedError));
				}

				if (serverStatus.status === this.operationInProgressStatus) {
					await this.getServerLogs(serverInformation.outputUrl, buildId);
				}
			}, CloudService.OPERATION_STATUS_CHECK_INTERVAL);
		});
	}

	protected async downloadServerResults(serverResult: IServerResult, serverOutputOptions: ICloudServerOutputDirectoryOptions): Promise<string[]> {

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
		};

		return targetFileNames;
	}

}
