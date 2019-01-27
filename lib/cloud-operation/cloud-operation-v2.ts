import { CloudOperationBase } from "./cloud-operation-base";
import { CloudOperationMessageTypes, CloudCommunicationEvents } from "../constants";

class CloudOperationV2 extends CloudOperationBase implements ICloudOperation {
	private static readonly WAIT_TO_START_TIMEOUT: number = 10 * 60 * 1000;

	private communicationChannel: ICloudCommunicationChannel;
	private waitToStartTimeout: NodeJS.Timer;
	private waitResultPromise: Promise<ICloudOperationResult>;

	constructor(protected id: string,
		protected serverResponse: IServerResponse,
		private $nsCloudCommunicationChannelFactory: ICloudCommunicationChannelFactory) {
		super(id, serverResponse);

		this.communicationChannel = this.$nsCloudCommunicationChannelFactory.create(serverResponse.communicationChannel, this.id);
	}

	public async sendMessage<T>(message: ICloudOperationMessage<T>): Promise<void> {
		this.isInitialized();
		await this.communicationChannel.sendMessage(message);
	}

	public async cleanup(exitCode?: number): Promise<void> {
		if (this.waitToStartTimeout) {
			clearTimeout(this.waitToStartTimeout);
			this.waitToStartTimeout = null;
		}

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
				this.cleanup(code);
				reject(new Error(`Communication channel closed with code ${code}`));
			};
			try {
				this.communicationChannel.once(CloudCommunicationEvents.CLOSE, closeHandler);
				await this.communicationChannel.connect();
				this.status = CloudOperationV2.OPERATION_IN_PROGRESS_STATUS;
			} catch (err) {
				return reject(err);
			}

			this.waitResultPromise = this.subscribeForMessages();
			this.communicationChannel.removeListener(CloudCommunicationEvents.CLOSE, closeHandler);
			resolve();
		});
	}

	protected waitForResultCore(): Promise<ICloudOperationResult> {
		return this.waitResultPromise;
	}

	private subscribeForMessages(): Promise<ICloudOperationResult> {
		let isResolved = false;
		return new Promise<ICloudOperationResult>((resolve, reject) => {
			this.communicationChannel.once(CloudCommunicationEvents.CLOSE, code => {
				this.cleanup(code);
				if (!isResolved) {
					reject(new Error(`Communication channel closed with code ${code}`));
				}
			});
			this.communicationChannel.on(CloudCommunicationEvents.MESSAGE, async (m) => {
				if (m.type === CloudOperationMessageTypes.CLOUD_OPERATION_RESULT) {
					this.result = <ICloudOperationResult>m.body;
					if (this.result.code === 0 || this.result.data) {
						this.status = CloudOperationV2.OPERATION_COMPLETE_STATUS;
						isResolved = true;
						return resolve(this.result);
					} else {
						this.status = CloudOperationV2.OPERATION_FAILED_STATUS;
						return reject(this.result);
					}
				}

				this.emit(CloudCommunicationEvents.MESSAGE, m);
			});
		});
	}
}

module.exports = CloudOperationV2;
