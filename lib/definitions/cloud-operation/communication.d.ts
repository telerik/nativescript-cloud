interface ICloudCommunicationChannel extends NodeJS.EventEmitter {
	connect(): Promise<void>;
	sendMessage<T>(message: ICloudOperationMessage<T>): Promise<string>;
	close(code: number, reason?: string): Promise<void>;


	on(event: "close", listener: (code: number, reason?: string) => void): this;
	on(event: "error", listener: (err: Error) => void): this;
	on<T>(event: "message", listener: (data: ICloudOperationMessage<T>) => void): this;
	on<T>(event: string, listener: (data: ICloudOperationMessage<T>) => void): this;
}

interface ICloudCommunicationChannelData<T> extends ICloudOperationId {
	type: string;
	config: T;
}

interface IWebsocketCloudChannelConfigProperties {
	url: string;
}

interface ICloudCommunicationChannelFactory {
	create<T>(communicationChannelData: ICloudCommunicationChannelData<T>, cloudOperationId: string): ICloudCommunicationChannel;
}

interface IWebSocket extends NodeJS.EventEmitter {
	CONNECTING: number;
	OPEN: number;
	CLOSING: number;
	CLOSED: number;
	readyState: number;
	close(code?: number, data?: string): void;
	send(data: any, cb?: (err?: Error) => void): void;
	send(data: any, options: { mask?: boolean; binary?: boolean; compress?: boolean; fin?: boolean }, cb?: (err?: Error) => void): void;
}

interface IWebSocketFactory {
	create(url: string): IWebSocket;
}
