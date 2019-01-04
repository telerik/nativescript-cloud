interface ICloudOperation extends NodeJS.EventEmitter {
    init(): Promise<void>;
    waitForResult(): Promise<ICloudOperationResult>;
    sendMessage<T>(message: ICloudOperationMessage<T>): Promise<void>;
}

interface ICloudOperationMessage<T> extends ICloudOperationId {
    type: string;
    body: T;
}

interface ICloudOperationOutput {
    data: string;
    pipe: string;
}

interface ICloudOperationInputBase {
    inputType: string;
    requestId: string;
}

interface ICloudOperationInputRequest extends ICloudOperationInputBase {
    message: string;
}

interface ICloudOperationInput extends ICloudOperationInputBase {
    content: string;
}
