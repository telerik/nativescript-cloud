import * as path from "path";
import { EventEmitter } from "events";
import { CloudOperationMessageTypes, CloudCommunicationEvents } from "../constants";
import { v4 } from "uuid";

export abstract class CloudService extends EventEmitter implements ICloudOperationService {
	private static readonly DEFAULT_SERVER_REQUEST_VERSION: string = "v1";
	protected abstract failedToStartError: string;
	protected abstract failedError: string;

	protected silent: boolean = true;
	private cloudOperations: IDictionary<ICloudOperation>;

	constructor(protected $errors: IErrors,
		protected $fs: IFileSystem,
		protected $httpClient: Server.IHttpClient,
		protected $logger: ILogger,
		private $nsCloudOperationFactory: ICloudOperationFactory,
		private $nsCloudS3Service: IS3Service,
		private $nsCloudOutputFilter: ICloudOutputFilter,
		private $processService: IProcessService) {
		super();
		this.cloudOperations = Object.create(null);
		this.$processService.attachToProcessExitSignals(this, this.cleanup.bind(this));
	}

	public abstract getServerOperationOutputDirectory(options: IOutputDirectoryOptions): string;

	public async sendCloudMessage<T>(message: ICloudOperationMessage<T>): Promise<void> {
		const cloudOperation = this.cloudOperations[message.cloudOperationId];
		if (!cloudOperation) {
			this.$errors.failWithoutHelp(`Cloud operation with id: ${message.cloudOperationId} not found.`);
		}

		await cloudOperation.sendMessage(message);
	}

	protected abstract getServerResults(serverResult: ICloudOperationResult): IServerItem[];

	protected async executeCloudOperation<T>(cloudOperationName: string, action: (cloudOperationId: string) => Promise<T>): Promise<T> {
		const cloudOperationId: string = v4();
		try {
			this.$logger.info(`Starting ${cloudOperationName}. Cloud operation id: ${cloudOperationId}`);
			const result = await action(cloudOperationId);
			return result
		} catch (err) {
			err.cloudOperationId = cloudOperationId;
			throw err;
		}
	}

	protected async waitForServerOperationToFinish(cloudOperationId: string, serverResponse: IServerResponse): Promise<ICloudOperationResult> {
		const cloudOperationVersion = serverResponse.cloudOperationVersion || CloudService.DEFAULT_SERVER_REQUEST_VERSION;
		const cloudOperation: ICloudOperation = this.$nsCloudOperationFactory.create(cloudOperationVersion, cloudOperationId, serverResponse);
		this.cloudOperations[cloudOperationId] = cloudOperation;

		cloudOperation.on(CloudCommunicationEvents.MESSAGE, (m: ICloudOperationMessage<any>) => {
			if (m.type === CloudOperationMessageTypes.CLOUD_OPERATION_OUTPUT && !this.silent) {
				const body: ICloudOperationOutput = m.body;
				if (body.pipe === "stdout") {
					// Print the output on the same line to have cool effects like loading indicators.
					// The cloud process will take care of the new lines.
					this.$logger.printInfoMessageOnSameLine(body.data);
				} else if (body.pipe === "stderr") {
					this.$logger.error(body.data);
				}
			}

			this.emit(CloudCommunicationEvents.MESSAGE, m);
		});

		try {
			await cloudOperation.init();
		} catch (err) {
			this.$logger.trace(err);
			await cloudOperation.cleanup();
			throw new Error(this.failedToStartError);
		}

		try {
			const result = await cloudOperation.waitForResult();
			await cloudOperation.cleanup();
			return result;
		} catch (err) {
			this.$logger.trace(err);
			await cloudOperation.cleanup();
			throw new Error(this.failedError);
		}
	}

	protected async downloadServerResults(serverResult: ICloudOperationResult, serverOutputOptions: IOutputDirectoryOptions): Promise<string[]> {
		const destinationDir = this.getServerOperationOutputDirectory(serverOutputOptions);
		this.$fs.ensureDirectoryExists(destinationDir);

		const serverResultObjs = this.getServerResults(serverResult);

		let targetFileNames: string[] = [];
		for (const serverResultObj of serverResultObjs) {
			this.$logger.info(`Result url: ${serverResultObj.fullPath}`);
			const targetFileName = path.join(destinationDir, serverResultObj.filename);
			targetFileNames.push(targetFileName);
			const targetFile = this.$fs.createWriteStream(targetFileName);

			// Download the output file.
			await this.$httpClient.httpRequest({
				url: serverResultObj.fullPath,
				pipeTo: targetFile
			});
		}

		return targetFileNames;
	}

	protected async getCollectedLogs(serverResponse: IServerResponse): Promise<string> {
		try {
			return this.$nsCloudOutputFilter.filter(await this.$nsCloudS3Service.getContentOfS3File(serverResponse.outputUrl));
		} catch (err) {
			this.$logger.warn(`Unable to get cloud operation output. Error is: ${err}`);
		}
	}

	protected getResult(cloudOperationId: string): ICloudOperationResult {
		return this.cloudOperations[cloudOperationId].getResult();
	}

	private async cleanup(): Promise<void> {
		await Promise.all(_(this.cloudOperations)
			.values<ICloudOperation>()
			.map(op => op.cleanup())
			.value()
		);
	}
}
