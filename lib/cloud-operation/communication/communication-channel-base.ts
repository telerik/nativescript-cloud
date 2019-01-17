import { EventEmitter } from "events";
import { CloudOperationMessageTypes, CloudCommunicationChannelExitCodes, CloudCommunicationEvents } from "../../constants";

export abstract class CommunicationChannelBase extends EventEmitter implements ICloudCommunicationChannel {
	private static readonly PING_INTERVAL: number = 10000;
	private static readonly MISSING_PING_REPLIES_COUNT: number = 6;

	protected isConnected: boolean;
	private pingInterval: NodeJS.Timer;
	private echoSequenceNumber: number = 0;
	private echoReplySequenceNumber: number = 0;

	private handshakeCompleteResolve: (value?: PromiseLike<void>) => void;

	constructor(protected cloudOperationId: string,
		protected data: ICloudChannelData,
		protected $logger: ILogger) {
		super();
	}

	public async connect(): Promise<void> {
		if (!this.isConnected) {
			await this.connectCore();
			this.isConnected = true;
			await this.handshake();
			await this.startPing();
		}
	}

	public async sendMessage<T>(message: ICloudOperationMessage<T>): Promise<string> {
		if (this.isConnected) {
			return await this.sendMessageCore(message);
		}
	}

	public async close(code: number, reason?: string): Promise<void> {
		if (!this.isConnected) {
			return;
		}

		try {
			if (this.pingInterval) {
				clearInterval(this.pingInterval);
				this.pingInterval = null;
			}

			const stopMsg: ICloudOperationMessage<ICloudOperationStop> = {
				type: CloudOperationMessageTypes.CLOUD_OPERATION_STOP,
				cloudOperationId: this.cloudOperationId,
				body: {
					code,
					reason
				}
			};
			await this.sendMessage<ICloudOperationStop>(stopMsg);
			await this.closeCore(code, reason);
		} catch (err) {
			this.$logger.trace(err);
		}

		this.isConnected = false;
		this.emit(CloudCommunicationEvents.CLOSE, code, reason);
	}

	protected abstract connectCore(): Promise<void>;
	protected abstract closeCore(code: number, reason?: string): Promise<void>;
	protected abstract sendMessageCore<T>(message: ICloudOperationMessage<T>): Promise<string>;

	protected _handleMessage(m: any): ICloudOperationMessage<any> {
		let msg: ICloudOperationMessage<any>;
		if (_.isBuffer(m)) {
			msg = JSON.parse(m.toString("utf8"));
		} else if (_.isString(m)) {
			msg = JSON.parse(m);
		} else {
			msg = m;
		}

		if (msg.type === CloudOperationMessageTypes.CLOUD_OPERATION_SERVER_HELLO) {
			this.handshakeCompleteResolve();
		} else if (msg.type === CloudOperationMessageTypes.CLOUD_OPERATION_ECHO_REPLY) {
			const body: ICloudOperationEcho = msg.body;
			if (body.identifier === this.cloudOperationId) {
				this.echoReplySequenceNumber = body.sequenceNumber;
			}
		}

		return msg;
	}

	private async handshake(): Promise<void> {
		await this.sendMessageCore({ type: CloudOperationMessageTypes.CLOUD_OPERATION_CLIENT_HELLO, cloudOperationId: this.cloudOperationId });
		await new Promise<void>((resolve, reject) => {
			this.handshakeCompleteResolve = resolve;
		});
	}

	private startPing(): void {
		this.pingInterval = setInterval(async () => {
			if (this.echoSequenceNumber - this.echoReplySequenceNumber >= CommunicationChannelBase.MISSING_PING_REPLIES_COUNT) {
				return this.close(CloudCommunicationChannelExitCodes.MISSING_ECHO_REPLIES, "Communication channel did not receive echo replies.");
			}

			const echoMsg: ICloudOperationMessage<ICloudOperationEcho> = {
				type: CloudOperationMessageTypes.CLOUD_OPERATION_ECHO,
				cloudOperationId: this.cloudOperationId,
				body: {
					identifier: this.cloudOperationId,
					sequenceNumber: this.echoSequenceNumber++
				}
			};
			await this.sendMessage(echoMsg);
		}, CommunicationChannelBase.PING_INTERVAL);
	}
}
