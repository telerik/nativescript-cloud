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
