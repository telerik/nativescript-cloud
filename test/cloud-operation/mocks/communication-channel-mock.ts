import { EventEmitter } from "events";

export class CommunicationChannelMock extends EventEmitter {
	constructor(private _connect: () => Promise<void>,
		private _sendMessage: (message: ICloudOperationMessage<any>) => Promise<string>,
		private _close: (code: number, reason?: string) => Promise<void>,
		private _on: (event: string | symbol, listener: (...args: any[]) => void) => any,
		private _once: (event: string | symbol, listener: (...args: any[]) => void) => any) {
		super();
	}

	public on(event: string | symbol, listener: (...args: any[]) => void): this {
		if (this._on) {
			return this._on(event, listener);
		}

		return super.on(event, listener);
	}

	public once(event: string | symbol, listener: (...args: any[]) => void): this {
		if (this._once) {
			return this._once(event, listener);
		}

		return super.once(event, listener);
	}

	public async sendMessage<T>(message: ICloudOperationMessage<T>): Promise<string> {
		if (this._sendMessage) {
			return await this._sendMessage(message);
		}
	}

	public async close(code: number, reason?: string): Promise<void> {
		if (this._close) {
			return await this._close(code, reason);
		}
	}

	public async connect(): Promise<void> {
		if (this._connect) {
			return await this._connect();
		}
	}
}
