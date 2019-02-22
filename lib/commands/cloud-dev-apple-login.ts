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
		private $options: ICloudOptions,
		protected $errors: IErrors,
		protected $fs: IFileSystem,
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
		const otp = this.$options.otp;
		if (otp) {
			this.predefinedAnswers.push({ searchString: "6 digit code", answer: otp }, { searchString: "4 digit code", answer: otp });
		}

		const credentials = await this.$nsCloudBuildCommandHelper.getAppleCredentials(args);
		const result = await this.$nsCloudAppleService.appleLogin(credentials);

		const outputPath = this.$options.outputPath;
		if (outputPath) {
			this.$fs.writeFile(outputPath, result);
			this.$logger.info(`Apple session saved in ${outputPath}`);
		} else {
			this.$logger.info(result);
		}
	}
}

$injector.registerCommand("cloud|dev-apple-login", CloudDevAppleLogin);
