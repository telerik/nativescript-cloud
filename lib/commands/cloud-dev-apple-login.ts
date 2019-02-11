import { ERROR_MESSAGES } from "../constants";
import { isInteractive } from "../helpers";
import { InteractiveCloudCommand } from "./interactive-cloud-command";

export class CloudDevAppleLogin extends InteractiveCloudCommand {
	public allowedParameters: ICommandParameter[];
	public get dashedOptions() {
		return this.$nsCloudOptionsProvider.dashedOptions;
	}

	constructor($processService: IProcessService,
		private $nsCloudEulaCommandHelper: IEulaCommandHelper,
		private $nsCloudOptionsProvider: ICloudOptionsProvider,
		protected $errors: IErrors,
		protected $logger: ILogger,
		protected $prompter: IPrompter,
		protected $nsCloudAppleService: ICloudAppleService,
		protected $nsCloudBuildCommandHelper: IBuildCommandHelper) {
		super($nsCloudAppleService, $processService, $errors, $logger, $prompter);
	}

	public async canExecute(args: string[]): Promise<boolean> {
		await this.$nsCloudEulaCommandHelper.ensureEulaIsAccepted();

		if (args.length > 2 || (!isInteractive() && args.length < 1)) {
			this.$errors.fail(ERROR_MESSAGES.COMMAND_REQUIRES_APPLE_USERNAME_PASS);
		}

		return true;
	}

	protected async executeCore(args: string[]): Promise<void> {
		const credentials = await this.$nsCloudBuildCommandHelper.getAppleCredentials(args);
		const result = await this.$nsCloudAppleService.appleLogin(credentials);
		this.$logger.info(result);
	}
}

$injector.registerCommand("cloud|dev-apple-login", CloudDevAppleLogin);
