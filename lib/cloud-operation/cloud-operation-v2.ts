import { CloudOperationBase } from "./cloud-operation-base";
import { CloudOperationMessageTypes, CloudCommunicationEvents } from "../constants";

class CloudOperationV2 extends CloudOperationBase implements ICloudOperation {
	private static readonly WAIT_TO_START_TIMEOUT: number = 10 * 60 * 1000;

	private communicationChannel: ICloudCommunicationChannel;
	private waitToStartTimeout: NodeJS.Timer;
	private waitResultPromise: Promise<ICloudOperationResult>;

	constructor(public id: string,
		protected serverResponse: IServerResponse,
		protected $logger: ILogger,
		protected $nsCloudOutputFilter: ICloudOutputFilter,
		protected $nsCloudS3Helper: IS3Helper,
		private $nsCloudCommunicationChannelFactory: ICloudCommunicationChannelFactory) {
		super(id, serverResponse, $logger, $nsCloudOutputFilter, $nsCloudS3Helper);

		this.communicationChannel = this.$nsCloudCommunicationChannelFactory.create(serverResponse.communicationChannel, this.id);
	}

	public async sendMessage<T>(message: ICloudOperationMessage<T>): Promise<void> {
		this.isInitialized();
		await this.communicationChannel.sendMessage(message);
	}

	public async cleanup(exitCode?: number): Promise<void> {
		await super.cleanup();
		if (this.waitToStartTimeout) {
			clearTimeout(this.waitToStartTimeout);
			this.waitToStartTimeout = null;
		}

		this.communicationChannel.removeAllListeners();
		await this.communicationChannel.close(exitCode);
	}

	protected initCore(): Promise<void> {
		return new Promise<void>(async (resolve, reject) => {
			this.waitToStartTimeout = setTimeout(() => {
				clearTimeout(this.waitToStartTimeout);
				this.waitToStartTimeout = null;
				if (!this.status) {
					return reject(new Error("Communication channel init timed out."));
				}
			}, CloudOperationV2.WAIT_TO_START_TIMEOUT);

			const closeHandler = (code: number) => {
				reject(new Error(`Communication channel closed with code ${code}`));
			};
			try {
				this.communicationChannel.once(CloudCommunicationEvents.CLOSE, closeHandler);
				// Subscribe here for messages to proxy serverHello.
				this.communicationChannel.on(CloudCommunicationEvents.MESSAGE, (m) => this.emit(CloudCommunicationEvents.MESSAGE, m));
				await this.communicationChannel.connect();
				this.status = CloudOperationV2.OPERATION_IN_PROGRESS_STATUS;
				this.waitResultPromise = this.getResultPromise();
				this.communicationChannel.removeListener(CloudCommunicationEvents.CLOSE, closeHandler);
				resolve();
			} catch (err) {
				return reject(err);
			}

		});
	}

	protected waitForResultCore(): Promise<ICloudOperationResult> {
		return this.waitResultPromise;
	}

	private getResultPromise(): Promise<ICloudOperationResult> {
		return new Promise<ICloudOperationResult>((resolve, reject) => {
			this.communicationChannel.once(CloudCommunicationEvents.CLOSE, code => {
				if (this.status && (this.status !== CloudOperationBase.OPERATION_COMPLETE_STATUS && this.status !== CloudOperationBase.OPERATION_FAILED_STATUS)) {
					reject(new Error(`Communication channel closed with code ${code}`));
				}
			});
			this.communicationChannel.on(CloudCommunicationEvents.MESSAGE, async (m) => {
				if (m.type === CloudOperationMessageTypes.CLOUD_OPERATION_RESULT) {
					this.result = <ICloudOperationResult>m.body;
					if (this.result.code === 0 || this.result.data) {
						this.status = CloudOperationV2.OPERATION_COMPLETE_STATUS;
					} else {
						this.status = CloudOperationV2.OPERATION_FAILED_STATUS;
					}

					resolve(this.result);
				}
			});
		});
	}
}

module.exports = CloudOperationV2;
