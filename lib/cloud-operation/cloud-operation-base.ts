import { EventEmitter } from "events";

export abstract class CloudOperationBase extends EventEmitter implements ICloudOperation {
	protected static OPERATION_COMPLETE_STATUS = "Success";
	protected static OPERATION_FAILED_STATUS = "Failed";
	protected static OPERATION_IN_PROGRESS_STATUS = "InProgress";

	protected result: ICloudOperationResult;
	protected status: string;
	protected initialized: boolean;

	constructor(protected id: string,
		protected serverResponse: IServerResponse,
		protected $logger: ILogger,
		protected $nsCloudOutputFilter: ICloudOutputFilter,
		protected $nsCloudS3Helper: IS3Service) {
		super();
	}

	public abstract sendMessage<T>(message: ICloudOperationMessage<T>): Promise<void>;

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
		const result = await this.waitForResultCore();

		return result;
	}

	public async cleanup(exitCode?: number): Promise<void> {
		this.removeAllListeners();
	}

	public getResult(): ICloudOperationResult {
		this.isInitialized();
		return this.result;
	}

	public async getCollectedLogs(): Promise<string> {
		try {
			return this.$nsCloudOutputFilter.filter(await this.$nsCloudS3Helper.getContentOfS3File(this.serverResponse.outputUrl));
		} catch (err) {
			this.$logger.warn(`Unable to get cloud operation output. Error is: ${err}`);
		}

		return "";
	}

	protected abstract waitForResultCore(): Promise<ICloudOperationResult>;
	protected abstract initCore(): Promise<void>;

	protected isInitialized() {
		if (!this.initialized) {
			throw new Error("Not initialized");
		}
	}
}
