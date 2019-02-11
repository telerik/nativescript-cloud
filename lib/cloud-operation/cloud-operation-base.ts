import { EventEmitter } from "events";

export abstract class CloudOperationBase extends EventEmitter implements ICloudOperation {
	protected static OPERATION_COMPLETE_STATUS = "Success";
	protected static OPERATION_FAILED_STATUS = "Failed";
	protected static OPERATION_IN_PROGRESS_STATUS = "InProgress";
	protected static BUILDING_STATUS = "Building";

	protected result: ICloudOperationResult;
	protected status: string;
	protected initialized: boolean;

	constructor(protected id: string, protected serverResponse: IServerResponse) {
		super();
	}

	public abstract sendMessage<T>(message: ICloudOperationMessage<T>): Promise<void>;
	public abstract cleanup(exitCode?: number): Promise<void>;

	public async init(): Promise<void> {
		try {
			await this.initCore();
			this.initialized = true;
		} catch (err) {
			await this.cleanup();
			throw err;
		}
	}

	public async waitForResult(): Promise<ICloudOperationResult> {
		this.isInitialized();
		try {
			const result = await this.waitForResultCore();

			return result;
		} catch (err) {
			await this.cleanup();
			throw err;
		}
	}

	public getResult(): ICloudOperationResult {
		this.isInitialized();
		return this.result;
	}

	protected abstract waitForResultCore(): Promise<ICloudOperationResult>;
	protected abstract initCore(): Promise<void>;

	protected isInitialized() {
		if (!this.initialized) {
			throw new Error("Not initialized");
		}
	}
}
