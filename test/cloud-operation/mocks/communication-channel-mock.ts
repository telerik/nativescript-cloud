import { EventEmitter } from "events";

export class CommunicationChannelMock extends EventEmitter {
	public async sendMessage<T>(message: ICloudOperationMessage<T>): Promise<string> {
		return null;
	}

	public async close(code: number, reason?: string): Promise<void> { /* no implementation required */ }

	public async connect(): Promise<void> { /* no implementation required */ }
}
