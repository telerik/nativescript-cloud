import { EOL } from "os";
import promiseRetry = require("promise-retry");

import { CloudOperationMessageTypes, CloudCommunicationEvents } from "../constants";
import { CloudOperationBase } from "./cloud-operation-base";

class CloudOperationV1 extends CloudOperationBase implements ICloudOperation {
	private static OPERATION_STATUS_CHECK_RETRY_COUNT = 8;
	private static OPERATION_STATUS_CHECK_INTERVAL = 1500;

	private outputCursorPosition: number;
	private serverStatus: IServerStatus;
	private statusCheckInterval: NodeJS.Timer;
	private logsCheckInterval: NodeJS.Timer;

	constructor(protected id: string,
		protected serverResponse: IServerResponse,
		protected $logger: ILogger,
		protected $nsCloudOutputFilter: ICloudOutputFilter,
		protected $nsCloudS3Helper: IS3Helper) {
		super(id, serverResponse, $logger, $nsCloudOutputFilter, $nsCloudS3Helper);

		this.outputCursorPosition = 0;
	}

	public async sendMessage<T>(message: ICloudOperationMessage<T>): Promise<void> {
		throw new Error("This version of the cloud operation does not support sending messages to the cloud services.");
	}

	public async cleanup(exitCode?: number): Promise<void> {
		await super.cleanup(exitCode);
		clearInterval(this.statusCheckInterval);
		clearInterval(this.logsCheckInterval);
	}

	protected async initCore(): Promise<void> {
		const promiseRetryOptions = {
			retries: CloudOperationV1.OPERATION_STATUS_CHECK_RETRY_COUNT,
			minTimeout: CloudOperationV1.OPERATION_STATUS_CHECK_INTERVAL
		};
		await promiseRetry(async (retry, attempt) => {
			try {
				this.serverStatus = await this.$nsCloudS3Helper.getJsonObjectFromS3File<IServerStatus>(this.serverResponse.statusUrl);
				return this.serverStatus;
			} catch (err) {
				this.$logger.trace(err);
				retry(new Error("Failed to start."));
			}
		}, promiseRetryOptions);

		this.pollForLogs();
	}

	protected async waitForResultCore(): Promise<ICloudOperationResult> {
		return new Promise<ICloudOperationResult>((resolve, reject) => {
			this.statusCheckInterval = setInterval(async () => {
				this.serverStatus = await this.$nsCloudS3Helper.getJsonObjectFromS3File<IServerStatus>(this.serverResponse.statusUrl);
				if (this.serverStatus.status === CloudOperationV1.OPERATION_COMPLETE_STATUS) {
					clearInterval(this.statusCheckInterval);
					this.result = await this.$nsCloudS3Helper.getJsonObjectFromS3File<ICloudOperationResult>(this.serverResponse.resultUrl);
					return resolve(this.result);
				}

				if (this.serverStatus.status === CloudOperationV1.OPERATION_FAILED_STATUS) {
					try {
						this.result = await this.$nsCloudS3Helper.getJsonObjectFromS3File<ICloudOperationResult>(this.serverResponse.resultUrl);
						clearInterval(this.statusCheckInterval);
						resolve(this.result);
					} catch (err) {
						clearInterval(this.statusCheckInterval);
						this.$logger.trace(err);
						return reject(new Error("Cloud operation failed"));
					}
				}

			}, CloudOperationV1.OPERATION_STATUS_CHECK_INTERVAL);
		});
	}

	private pollForLogs(): void {
		this.logsCheckInterval = setInterval(async () => {
			await this.getCloudOperationLogs();

			const status = this.serverStatus.status;
			if (status === CloudOperationBase.OPERATION_COMPLETE_STATUS || status === CloudOperationBase.OPERATION_FAILED_STATUS) {
				clearInterval(this.logsCheckInterval);
				return;
			}
		}, CloudOperationV1.OPERATION_STATUS_CHECK_INTERVAL);
	}

	private async getCloudOperationLogs(): Promise<void> {
		try {
			const logs = await this.$nsCloudS3Helper.getContentOfS3File(this.serverResponse.outputUrl);
			// The logs variable will contain the full server log and we need to log only the logs that we don't have.
			const contentToLog = this.$nsCloudOutputFilter.filter(logs.substr(this.outputCursorPosition));
			if (contentToLog) {
				const data: ICloudOperationMessage<ICloudOperationOutput> = {
					type: CloudOperationMessageTypes.CLOUD_OPERATION_OUTPUT,
					cloudOperationId: this.id,
					body: {
						data: contentToLog + EOL,
						pipe: "stdout"
					}
				};
				this.emit(CloudCommunicationEvents.MESSAGE, data);
			}

			this.outputCursorPosition = logs.length <= 0 ? 0 : logs.length - 1;
		} catch (err) {
			// Ignore the error from getting the server output because the task can finish even if there is error.
			this.$logger.trace(`Error while getting server logs: ${err}`);
		}
	}
}

module.exports = CloudOperationV1;
