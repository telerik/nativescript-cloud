import { EventEmitter } from "events";
import { CloudOperationMessageTypes, CloudCommunicationChannelExitCodes, CloudCommunicationEvents } from "../../constants";
import { join } from "path";

export abstract class CommunicationChannelBase extends EventEmitter implements ICloudCommunicationChannel {
	protected static readonly COMMUNICATION_PROTOCOL_VERSION: string = "v2";
	private static readonly PING_INTERVAL: number = 10000;
	private static readonly MISSING_PING_REPLIES_COUNT: number = 6;
	private static readonly CONNECT_TIMEOUT: number = 60000;

	protected isConnected: boolean;
	private pingInterval: NodeJS.Timer;
	private connectTimeout: NodeJS.Timer;
	private echoSequenceNumber: number = 0;
	private echoReplySequenceNumber: number = 0;

	private handshakeResolve: (value?: PromiseLike<void>) => void;
	private handshakeReject: (reason?: any) => void;

	constructor(protected cloudOperationId: string,
		protected data: ICloudCommunicationChannelData<any>,
		protected $logger: ILogger,
		protected $cleanupService: ICleanupService) {
		super();
	}
	//

	public async connect(): Promise<void> {
		if (!this.isConnected) {
			const connect = new Promise(async (resolve, reject) => {
				this.connectTimeout = setTimeout(() => {
					clearTimeout(this.connectTimeout);
					reject(new Error("Failed to connect to the communication channel."));
				}, CommunicationChannelBase.CONNECT_TIMEOUT);

				try {
					await this.connectCore();
					await this.handshake();
					this.isConnected = true;
				} catch (err) {
					clearTimeout(this.connectTimeout);

					reject(err);
					return;
				}

				clearTimeout(this.connectTimeout);
				resolve();
			});

			await connect;
			this.startPing();
		}
	}

	public async sendMessage<T>(message: ICloudOperationMessage<T>): Promise<string> {
		if (this.isConnected) {
			const result = await this.sendMessageCore(message);

			return result;
		}

		throw new Error("Communication channel not connected");
	}

	public async close(code: number, reason?: string): Promise<void> {
		if (!this.isConnected) {
			return;
		}

		try {
			clearTimeout(this.connectTimeout);

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
			// TODO: pass correct data
			await this.$cleanupService.removeCleanupJS(join(__dirname, "cleanup-websocket.js"), {})
		} catch (err) {
			this.$logger.trace(err);
		}

		this.isConnected = false;
		this.emit(CloudCommunicationEvents.CLOSE, code, reason);
	}

	protected abstract connectCore(): Promise<void>;
	protected abstract closeCore(code: number, reason?: string): Promise<void>;
	protected abstract sendMessageCore<T>(message: ICloudOperationMessage<T>): Promise<string>;

	protected async handleMessage(m: any): Promise<void> {
		let msg: ICloudOperationMessage<any>;
		if (_.isBuffer(m)) {
			msg = JSON.parse(m.toString("utf8"));
		} else if (_.isString(m)) {
			msg = JSON.parse(m);
		} else {
			msg = m;
		}

		if (msg.type === CloudOperationMessageTypes.CLOUD_OPERATION_SERVER_HELLO) {
			this.handshakeResolve();
		} if (msg.type === CloudOperationMessageTypes.CLOUD_OPERATION_HANDSHAKE_ERROR) {
			const body: ICloudOperationHandshakeError = msg.body;

			this.handshakeReject(new Error(body.message));

			return;
		} else if (msg.type === CloudOperationMessageTypes.CLOUD_OPERATION_ECHO) {
			const body: ICloudOperationEcho = msg.body;
			const echoReply: ICloudOperationMessage<ICloudOperationEcho> = {
				type: CloudOperationMessageTypes.CLOUD_OPERATION_ECHO_REPLY,
				cloudOperationId: this.cloudOperationId,
				body
			};
			await this.sendMessage(echoReply);
		} else if (msg.type === CloudOperationMessageTypes.CLOUD_OPERATION_ECHO_REPLY) {
			const body: ICloudOperationEcho = msg.body;
			if (body.identifier === this.cloudOperationId) {
				this.echoReplySequenceNumber = body.sequenceNumber;
			}
		}

		this.emit(CloudCommunicationEvents.MESSAGE, msg);

		return;
	}

	private async handshake(): Promise<void> {
		const handshakePromise = new Promise<void>((resolve, reject) => {
			this.handshakeResolve = resolve;
			this.handshakeReject = reject;
		});
		const clientHello: ICloudOperationMessage<ICloudOperationClientHello> = {
			type: CloudOperationMessageTypes.CLOUD_OPERATION_CLIENT_HELLO,
			cloudOperationId: this.cloudOperationId,
			body: {
				communicationProtocolVersion: CommunicationChannelBase.COMMUNICATION_PROTOCOL_VERSION
			}
		};
		await this.sendMessageCore(clientHello);
		await handshakePromise;
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
