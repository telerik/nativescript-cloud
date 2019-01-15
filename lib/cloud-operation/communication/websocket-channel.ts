import * as WebSocket from "ws";
import { v4 } from "uuid";

import { CommunicationChannelBase } from "./communication-channel-base";
import { CloudOperationMessageTypes, CloudOperationWebsocketMessageActions } from "../../constants";

export class WebsocketCommunicationChannel extends CommunicationChannelBase {
	private ws: WebSocket;

	private handshakeCompleteResolve: (value?: PromiseLike<void>) => void;

	constructor(protected cloudOperationId: string,
		protected data: ICloudChannelData,
		protected $logger: ILogger) {
		super(cloudOperationId, data, $logger);
	}

	public async close(code?: number): Promise<void> {
		await super.close(code);
		if (this.ws.readyState === this.ws.OPEN) {
			this.isConnected = false;
			this.ws.close(code);
		}
	}

	protected sendMessageCore<T>(message: ICloudOperationMessage<T>): Promise<string> {
		return new Promise((resolve, reject) => {
			try {
				const id = v4();
				const wsMsg: ICloudOperationWebsocketMessage<T> = { id, action: CloudOperationWebsocketMessageActions.SEND_MESSAGE, cloudOperationId: this.cloudOperationId, body: message };
				this.$logger.trace(wsMsg);
				this.ws.send(JSON.stringify(wsMsg), err => {
					if (err) {
						return reject(err);
					}

					resolve(id);
				});
			} catch (err) {
				reject(err);
			}
		});
	}

	protected connectCore(): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			try {
				this.ws = new WebSocket(this.data.config.url);
				this.ws.once("close", (c, r) => {
					this.emit("close", c, r);
					reject(new Error(`Connection closed with code: ${c}`));
				});

				this.ws.once("unexpected-response", () => {
					reject(new Error("Unexpected response received."))
				})
			} catch (err) {
				return reject(err);
			}

			this.handshakeCompleteResolve = resolve;
			this.addChannelListeners();
			this.ws.once("open", async () => {
				try {
					await this.sendMessageCore({ type: CloudOperationMessageTypes.CLOUD_OPERATION_CLIENT_HELLO, cloudOperationId: this.cloudOperationId });
				} catch (err) {
					return reject(err);
				}
			});
		});
	}

	private addChannelListeners() {
		this.ws.on("message", (m) => {
			if (!m) {
				return;
			}

			// TODO: handle errors.
			let msg: ICloudOperationMessage<any>;
			if (_.isBuffer(m)) {
				msg = JSON.parse(m.toString());
			} else {
				msg = JSON.parse(<string>m);
			}

			if (msg.type === CloudOperationMessageTypes.CLOUD_OPERATION_SERVER_HELLO) {
				this.handshakeCompleteResolve();
			}

			this.emit("message", msg);
		});

		this.ws.on("error", err => this.emit("error", err));
		this.ws.on("close", (code, reason) => this.emit("close", code, reason));
	}
}
