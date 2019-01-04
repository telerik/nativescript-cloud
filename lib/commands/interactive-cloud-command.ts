import { isInteractive } from "../helpers";
import { CloudOperationMessageTypes } from "../constants";

export abstract class InteractiveCloudCommand implements ICommand {
	public allowedParameters: ICommandParameter[];

	constructor(private interactiveService: ICloudOperationService,
		protected $logger: ILogger,
		protected $prompter: IPrompter) { }

	public async execute(args: string[]): Promise<void> {
		this.interactiveService.on(CloudOperationMessageTypes.CLOUD_OPERATION_INPUT_REQUEST, async (msg: ICloudOperationMessage<ICloudOperationInputRequest>) => {
			if (!isInteractive()) {
				this.$logger.warn(`Input is required but the process is not interactive. "${msg.body.message}"`);
				return;
			}

			let input = "";
			if (msg.body.inputType === "password") {
				input = await this.$prompter.getPassword(msg.body.message);
			} else {
				input = await this.$prompter.getString(msg.body.message);
			}

			try {
				const inputBody = { inputType: msg.type, requestId: msg.body.requestId, content: input };
				const cloudMessage: ICloudOperationMessage<ICloudOperationInput> = { type: CloudOperationMessageTypes.CLOUD_OPERATION_INPUT, cloudOperationId: msg.cloudOperationId, body: inputBody };
				await this.interactiveService.sendCloudMessage(cloudMessage);
			} catch (err) {
				if (err) {
					this.$logger.warn(`Can't send input to cloud operation ${msg.cloudOperationId}. Error is ${err}.`);
				}
			}
		});

		await this.executeCore(args);
	}

	public abstract canExecute(args: string[]): Promise<boolean>;

	protected abstract executeCore(args: string[]): Promise<void>;
}
