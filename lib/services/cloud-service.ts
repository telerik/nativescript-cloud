import * as path from "path";
import { EventEmitter } from "events";
import { CloudOperationMessageTypes } from "../constants";

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
		private $injector: IInjector,
		private $nsCloudS3Service: IS3Service,
		private $nsCloudOutputFilter: ICloudOutputFilter) {
		super();
		this.cloudOperations = Object.create(null);
	}

	public abstract getServerOperationOutputDirectory(options: IOutputDirectoryOptions): string;

	protected abstract getServerResults(serverResult: ICloudOperationResult): IServerItem[];

	public async sendCloudMessage<T>(message: ICloudOperationMessage<T>): Promise<void> {
		const cloudOperation = this.cloudOperations[message.cloudOperationId];
		if (!cloudOperation) {
			this.$errors.failWithoutHelp(`Cloud operation with id: ${message.cloudOperationId} not found.`);
		}

		await cloudOperation.sendMessage(message);
	}

	protected async waitForServerOperationToFinish(cloudOperationId: string, serverResponse: IServerResponse): Promise<ICloudOperationResult> {
		const cloudOperation: ICloudOperation = this.$injector.resolve(require(`../cloud-operation-${serverResponse.requestVersion || CloudService.DEFAULT_SERVER_REQUEST_VERSION}`), { id: cloudOperationId, serverResponse: serverResponse });
		this.cloudOperations[cloudOperationId] = cloudOperation;

		// TODO: add the event to the d.ts and remove the any.
		cloudOperation.on("data", (d: ICloudOperationMessage<any>) => {
			if (d.type === CloudOperationMessageTypes.CLOUD_OPERATION_OUTPUT && !this.silent) {
				const body: ICloudOperationOutput = d.body;
				if (body.pipe === "stdout") {
					this.$logger.error(body.data);
				} else if (body.pipe === "stderr") {
					this.$logger.info(body.data);
				}
			} else if (d.type === CloudOperationMessageTypes.CLOUD_OPERATION_INPUT_REQUEST) {
				const body: ICloudOperationInputRequest = d.body;
				this.emit(CloudOperationMessageTypes.CLOUD_OPERATION_INPUT_REQUEST, body);
			}
		});

		try {
			await cloudOperation.init();
		} catch (err) {
			this.$logger.trace(err);
			throw new Error(this.failedToStartError);
		}

		try {
			return await cloudOperation.waitForResult();
		} catch (err) {
			this.$logger.trace(err);
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
}
