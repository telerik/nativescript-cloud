import promiseRetry = require("promise-retry");

import { CloudOperationMessageTypes } from "../constants";
import { CloudOperationBase } from "./cloud-operation-base";

module.exports = class CloudOperationV1 extends CloudOperationBase implements ICloudOperation {
	private static OPERATION_STATUS_CHECK_RETRY_COUNT = 8;
	private static OPERATION_STATUS_CHECK_INTERVAL = 1500;

	private outputCursorPosition: number;
	private serverStatus: IServerStatus;
	private statusCheckInterval: NodeJS.Timer;
	private logsCheckInterval: NodeJS.Timer;

	constructor(protected id: string,
		protected serverResponse: IServerResponse,
		private $logger: ILogger,
		private $nsCloudOutputFilter: ICloudOutputFilter,
		private $nsCloudS3Service: IS3Service) {
		super(id, serverResponse);

		this.outputCursorPosition = 0;
	}


	public async sendMessage<T>(message: ICloudOperationMessage<T>): Promise<void> {
		this.$logger.warn("This version of the cloud operation does not support sending messages to the cloud services.");
	}

	public async cleanup(): Promise<void> {
		clearInterval(this.statusCheckInterval);
		clearInterval(this.logsCheckInterval);
	}

	protected async initCore(): Promise<void> {
		const promiseRetryOptions = {
			retries: CloudOperationV1.OPERATION_STATUS_CHECK_RETRY_COUNT,
			minTimeout: CloudOperationV1.OPERATION_STATUS_CHECK_INTERVAL
		};
		await promiseRetry((retry, attempt) => {
			return new Promise<IServerStatus>((resolve, reject) => {
				this.$nsCloudS3Service.getJsonObjectFromS3File<IServerStatus>(this.serverResponse.statusUrl)
					.then(serverStatus => {
						this.serverStatus = serverStatus;
						resolve(this.serverStatus);
					})
					.catch(err => {
						this.$logger.trace(err);
						reject(new Error("Failed to start."));
					});
			}).catch(retry);
		}, promiseRetryOptions);

		this.pollForLogs();
	}

	protected async waitForResultCore(): Promise<ICloudOperationResult> {
		return new Promise<ICloudOperationResult>((resolve, reject) => {
			this.statusCheckInterval = setInterval(async () => {
				this.serverStatus = await this.$nsCloudS3Service.getJsonObjectFromS3File<IServerStatus>(this.serverResponse.statusUrl);
				if (this.serverStatus.status === CloudOperationV1.OPERATION_COMPLETE_STATUS) {
					clearInterval(this.statusCheckInterval);
					this.result = await this.$nsCloudS3Service.getJsonObjectFromS3File<ICloudOperationResult>(this.serverResponse.resultUrl);
					return resolve(this.result);
				}

				if (this.serverStatus.status === CloudOperationV1.OPERATION_FAILED_STATUS) {
					try {
						this.result = await this.$nsCloudS3Service.getJsonObjectFromS3File<ICloudOperationResult>(this.serverResponse.resultUrl);
					} catch (err) {
						this.$logger.trace(err)
					}

					clearInterval(this.statusCheckInterval);
					return reject(new Error("Cloud operation failed"));
				}

			}, CloudOperationV1.OPERATION_STATUS_CHECK_INTERVAL);
		});
	}

	private pollForLogs(): void {
		this.logsCheckInterval = setInterval(async () => {
			if (this.serverStatus.status === CloudOperationBase.OPERATION_COMPLETE_STATUS) {
				await this.getServerLogs(this.serverResponse.outputUrl);
				clearInterval(this.logsCheckInterval);
				return;
			}

			if (this.serverStatus.status === CloudOperationBase.OPERATION_FAILED_STATUS) {
				await this.getServerLogs(this.serverResponse.outputUrl);
				return;
			}

			if (this.serverStatus.status === CloudOperationBase.OPERATION_IN_PROGRESS_STATUS) {
				await this.getServerLogs(this.serverResponse.outputUrl);
			}

		}, CloudOperationV1.OPERATION_STATUS_CHECK_INTERVAL);
	}

	private async getServerLogs(logsUrl: string): Promise<void> {
		try {
			const logs = await this.$nsCloudS3Service.getContentOfS3File(logsUrl);
			// The logs variable will contain the full server log and we need to log only the logs that we don't have.
			const contentToLog = this.$nsCloudOutputFilter.filter(logs.substr(this.outputCursorPosition));
			if (contentToLog) {
				const data: ICloudOperationMessage<ICloudOperationOutput> = { type: CloudOperationMessageTypes.CLOUD_OPERATION_OUTPUT, cloudOperationId: this.id, body: { data: contentToLog, pipe: "stdout" } };
				this.emit("message", data);
			}

			this.outputCursorPosition = logs.length <= 0 ? 0 : logs.length - 1;
		} catch (err) {
			// Ignore the error from getting the server output because the task can finish even if there is error.
			this.$logger.trace(`Error while getting server logs: ${err}`);
		}
	}
}
