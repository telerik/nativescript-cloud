import { Policy } from "../constants";

export class LoginCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor(private $errors: IErrors,
		private $nsCloudEulaCommandHelper: IEulaCommandHelper,
		private $nsCloudAuthenticationService: IAuthenticationService,
		private $nsCloudPolicyService: IPolicyService,
		private $commandsService: ICommandsService,
		private $logger: ILogger,
		private $options: IOptions,
		private $prompter: IPrompter) { }

	public async execute(args: string[]): Promise<void> {
		await this.$nsCloudEulaCommandHelper.ensureEulaIsAccepted();

		await this.$nsCloudAuthenticationService.login({ timeout: this.$options.timeout });
		this.$logger.info("Successfully logged in.");
		await this.$commandsService.tryExecuteCommand("user", []);
	}

	public async canExecute(args: string[]): Promise<boolean> {
		if (await this.$nsCloudPolicyService.shouldAcceptPrivacyPolicy()) {
			this.$logger.info(await this.$nsCloudPolicyService.getPrivacyPolicyMessage());
			const promptMessage = "Input yes to agree".green + " or " + "leave empty to decline".red.bold + ":";
			const res = await this.$prompter.getString(promptMessage, { allowEmpty: true });

			if (res !== "yes") {
				this.$errors.failWithoutHelp(`You must agree to the ${Policy.PRIVACY_POLICY_NAME} to continue.`);
			} else {
				await this.$nsCloudPolicyService.acceptPrivacyPolicy();
			}
		}

		return true;
	}
}

$injector.registerCommand("login", LoginCommand);
