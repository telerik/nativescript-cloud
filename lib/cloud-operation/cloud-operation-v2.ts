import { CloudOperationBase } from "./cloud-operation-base";
import { CloudCommunicationChannelTypes, CloudOperationMessageTypes } from "../constants";
import { WebsocketCommunicationChannel } from "./communication/websocket-channel";

module.exports = class CloudOperationV2 extends CloudOperationBase implements ICloudOperation {
	private static readonly WAIT_TO_START_TIMEOUT: number = 10 * 60 * 1000;

	private communicationChannel: ICloudCommunicationChannel;
	private waitToStartTimeout: NodeJS.Timer;
	private waitResultPromise: Promise<ICloudOperationResult>;

	constructor(protected id: string,
		protected serverResponse: IServerResponse,
		private $injector: IInjector) {
		super(id, serverResponse);

		if (serverResponse.communicationChannel.type === CloudCommunicationChannelTypes.WEBSOCKET) {
			this.communicationChannel = this.$injector.resolve(WebsocketCommunicationChannel, { data: serverResponse.communicationChannel, cloudOperationId: this.id });
		}

		// TODO: attach to process exit signals and cleanup with error.
	}

	public async sendMessage<T>(message: ICloudOperationMessage<T>): Promise<void> {
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

			try {
				await this.communicationChannel.connect();
				this.status = CloudOperationV2.OPERATION_IN_PROGRESS_STATUS;
			} catch (err) {
				return reject(err);
			}

			this.waitResultPromise = this.subscribeForMessages();
			resolve();
		});
	}

	protected waitForResultCore(): Promise<ICloudOperationResult> {
		return this.waitResultPromise;
	}

	private subscribeForMessages(): Promise<ICloudOperationResult> {
		return new Promise<ICloudOperationResult>((resolve, reject) => {
			this.communicationChannel.on("message", async (m) => {
				if (m.type === CloudOperationMessageTypes.CLOUD_OPERATION_RESULT) {
					this.result = <ICloudOperationResult>m.body;
					if (this.result.code === 0) {
						this.status = CloudOperationV2.OPERATION_COMPLETE_STATUS;
						return resolve(this.result);
					} else {
						this.status = CloudOperationV2.OPERATION_FAILED_STATUS;
						return reject(this.result);
					}
				}

				this.emit("message", m);
			});

			// TODO: subscribe for error and close and retry on close.
		});
	}
}
