interface ICloudOperation extends NodeJS.EventEmitter {
	id: string;

	init(): Promise<void>;
	waitForResult(): Promise<ICloudOperationResult>;
	sendMessage<T>(message: ICloudOperationMessage<T>): Promise<void>;
	cleanup(exitCode?: number): Promise<void>;
	getResult(): ICloudOperationResult;
	getCollectedLogs(): Promise<string>;
}

interface ICloudOperationWebSocketMessage<T> extends ICloudOperationId {
	id: string;
	action: string;
	body: ICloudOperationMessage<T>;
}

interface ICloudOperationMessage<T> extends ICloudOperationId {
	type: string;
	body?: T;
}

interface ICloudOperationOutput {
	data: string;
	pipe: string;
}

interface ICloudOperationInputBase {
	inputType: string;
	inputRequestId: string;
}

interface ICloudOperationInputRequest extends ICloudOperationInputBase {
	message: string;
}

interface ICloudOperationInput extends ICloudOperationInputBase {
	content: string;
}

interface ICloudOperationStop {
	code: number;
	reason?: string;
}

interface ICloudOperationStatus {
	status: string;
}

interface ICloudOperationEcho {
	identifier: string;
	sequenceNumber: number;
}

interface ICloudOperationClientHello {
	communicationProtocolVersion: string;
}

interface ICloudOperationServerHello {
	hostName?: string;
}

interface ICloudOperationHandshakeError {
	message: string;
	code: number;
}

interface ICloudOperationFactory {
	create(cloudOperationVersion: string, cloudOperationId: string, serverResponse: IServerResponse): ICloudOperation;
}
