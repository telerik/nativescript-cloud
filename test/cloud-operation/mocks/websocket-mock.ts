import { EventEmitter } from "events";
import { CloudOperationMessageTypes } from "../../../lib/constants";

export class WebSocketMock extends EventEmitter implements IWebSocket {
	public CONNECTING: number;
	public OPEN: number;
	public CLOSING: number;
	public CLOSED: number;
	public readyState: number;

	public close(code?: number, data?: string): void { /* no implementation required */ }

	public send(data: any, cb?: (err?: Error) => void): void;
	public send(data: any, options: { mask?: boolean; binary?: boolean; compress?: boolean; fin?: boolean; }, cb?: (err?: Error) => void): void;
	public send(data: any, options?: any, cb?: any) {
		const parsed: ICloudOperationWebSocketMessage<any> = JSON.parse(data);
		if (parsed.body.type === CloudOperationMessageTypes.CLOUD_OPERATION_CLIENT_HELLO) {
			this.emit("message", { type: CloudOperationMessageTypes.CLOUD_OPERATION_SERVER_HELLO, body: {} });
		}

		(cb || options)(this.sendCore(parsed));
	}

	public sendCore(data: ICloudOperationWebSocketMessage<any>): Error { return null; }
}
