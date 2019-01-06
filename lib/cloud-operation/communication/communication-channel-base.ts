import { EventEmitter } from "events";
import { CloudOperationMessageTypes } from "../../constants";

export abstract class CommunicationChannelBase extends EventEmitter implements ICloudCommunicationChannel {
	protected isConnected: boolean;

	constructor(protected cloudOperationId: string,
		protected data: ICloudChannelData,
		protected $logger: ILogger) {
		super();
	}

	public async connect(): Promise<void> {
		if (!this.isConnected) {
			await this.connectCore();
			this.isConnected = true;
		}
	}

	public async sendMessage<T>(message: ICloudOperationMessage<T>): Promise<string> {
		if (this.isConnected) {
			return await this.sendMessageCore(message);
		}
	}

	public async close(code?: number): Promise<void> {
		try {
			await this.sendMessage<ICloudOperationStop>({ type: CloudOperationMessageTypes.CLOUD_OPERATION_STOP, cloudOperationId: this.cloudOperationId, body: { code } });
		} catch (err) {
			this.$logger.trace(err);
		}
	}

	protected abstract connectCore(): Promise<void>;
	protected abstract sendMessageCore<T>(message: ICloudOperationMessage<T>): Promise<string>;
}
