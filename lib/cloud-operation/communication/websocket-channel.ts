import { v4 } from "uuid";

import { CommunicationChannelBase } from "./communication-channel-base";
import { CloudOperationWebSocketMessageActions, CloudCommunicationEvents, CloudCommunicationChannelExitCodes } from "../../constants";

export class WebSocketCommunicationChannel extends CommunicationChannelBase {
	private ws: IWebSocket;

	constructor(protected cloudOperationId: string,
		protected data: ICloudCommunicationChannelData<IWebSocketCloudChannelConfigProperties>,
		protected $logger: ILogger,
		private $nsCloudWebSocketFactory: IWebSocketFactory) {
		super(cloudOperationId, data, $logger);
	}

	protected async closeCore(code: number, reason?: string): Promise<void> {
		this.ws.removeAllListeners();
		if (this.ws.readyState === this.ws.OPEN) {
			this.ws.close();
		}
	}

	protected sendMessageCore<T>(message: ICloudOperationMessage<T>): Promise<string> {
		return new Promise((resolve, reject) => {
			try {
				const id = v4();
				const wsMsg: ICloudOperationWebSocketMessage<T> = { id, action: CloudOperationWebSocketMessageActions.SEND_MESSAGE, cloudOperationId: this.cloudOperationId, body: message };
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

	protected async connectCore(): Promise<void> {
		this.ws = this.$nsCloudWebSocketFactory.create(this.data.config.url);
		await new Promise<void>((resolve, reject) => {
			const closeHandler = (c: number, r: string) => {
				reject(new Error(`Connection closed with code: ${c}`));
				this.close(c, r);
			};
			const unexpectedResponseHandler = () => {
				const errMsg = "Unexpected response received.";
				reject(new Error(errMsg));
				this.close(CloudCommunicationChannelExitCodes.UNEXPECTED_RESPONSE, errMsg);
			};

			this.ws.once("close", closeHandler);
			this.ws.once("unexpected-response", unexpectedResponseHandler);
			this.ws.once("open", () => {
				this.ws.removeListener("close", closeHandler);
				this.ws.removeListener("unexpected-response", unexpectedResponseHandler);
				this.addChannelListeners();
				resolve();
			});
		});
	}

	private addChannelListeners() {
		this.ws.on(CloudCommunicationEvents.MESSAGE, m => super.handleMessage(m));
		this.ws.on(CloudCommunicationEvents.ERROR, err => this.emit("error", err));

		this.ws.once(CloudCommunicationEvents.CLOSE, this.close.bind(this));
	}
}
