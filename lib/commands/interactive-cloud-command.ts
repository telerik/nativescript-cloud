import { isInteractive } from "../helpers";
import { CloudOperationMessageTypes, CloudCommunicationEvents } from "../constants";

export abstract class InteractiveCloudCommand implements ICommand {
	public allowedParameters: ICommandParameter[];

	protected predefinedAnswers: IPredefinedAnswer[];

	constructor(private interactiveService: ICloudService,
		private $processService: IProcessService,
		protected $errors: IErrors,
		protected $logger: ILogger,
		protected $prompter: IPrompter) {
		this.predefinedAnswers = [];
	}

	public async execute(args: string[]): Promise<void> {
		const messageHandler = async (msg: ICloudOperationMessage<ICloudOperationInputRequest>) => {
			if (msg.type === CloudOperationMessageTypes.CLOUD_OPERATION_INPUT_REQUEST) {
				const predefinedAnswer = _.find(this.predefinedAnswers, a => msg.body.message.indexOf(a.searchString) >= 0);
				if (!isInteractive() && !predefinedAnswer) {
					this.$errors.failWithoutHelp(`Input is required but the process is not interactive. "${msg.body.message}"`);
				}

				let input = "";
				if (predefinedAnswer) {
					input = predefinedAnswer.answer;
				} else {
					// Print one new line because we print the cloud operation output on the same line.
					this.$logger.info();

					if (msg.body.inputType === "password") {
						input = await this.$prompter.getPassword(msg.body.message);
					} else {
						input = await this.$prompter.getString(msg.body.message);
					}
				}

				await this.sendInput(msg, input);
			}
		};

		this.interactiveService.on(CloudCommunicationEvents.MESSAGE, messageHandler);

		this.$processService.attachToProcessExitSignals(this, () => {
			this.interactiveService.removeListener(CloudCommunicationEvents.MESSAGE, messageHandler);
		});

		await this.executeCore(args);
	}

	public abstract canExecute(args: string[]): Promise<boolean>;

	protected abstract executeCore(args: string[]): Promise<void>;

	private async sendInput(msg: ICloudOperationMessage<ICloudOperationInputRequest>, input: string): Promise<void> {
		try {
			const inputBody: ICloudOperationInput = { inputType: msg.body.inputType, inputRequestId: msg.body.inputRequestId, content: input };
			const cloudMessage: ICloudOperationMessage<ICloudOperationInput> = { type: CloudOperationMessageTypes.CLOUD_OPERATION_INPUT, cloudOperationId: msg.cloudOperationId, body: inputBody };
			await this.interactiveService.sendCloudMessage(cloudMessage);
		} catch (err) {
			this.$logger.trace(`Can't send input to cloud operation ${msg.cloudOperationId}. Error is ${err}.`);
		}
	}
}
