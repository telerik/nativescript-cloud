import { EventEmitter } from "events";

export abstract class CloudOperationBase extends EventEmitter implements ICloudOperation {
	protected static OPERATION_COMPLETE_STATUS = "Success";
	protected static OPERATION_FAILED_STATUS = "Failed";
	protected static OPERATION_IN_PROGRESS_STATUS = "InProgress";

	constructor(protected id: string, protected serverResponse: IServerResponse) {
		super();
	}

	public abstract async init(): Promise<void>;
	public abstract sendMessage<T>(message: ICloudOperationMessage<T>): Promise<void>;

	public async waitForResult(): Promise<ICloudOperationResult> {
		try {
			await this.waitForResultCore();
			return await this.getResultObject();
		} catch (err) {
			this.cleanup();
			throw err;
		}
	}

	protected abstract async waitForResultCore(): Promise<ICloudOperationResult>;
	protected abstract cleanup(): void;
	protected abstract getResultObject(): Promise<ICloudOperationResult>;
}
