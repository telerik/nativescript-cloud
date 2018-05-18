export class LoginCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor(private $errors: IErrors,
		private $nsCloudEulaCommandHelper: IEulaCommandHelper,
		private $nsCloudAuthenticationService: IAuthenticationService,
		private $nsCloudServicesPolicyService: ICloudServicesPolicyService,
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
		if (await this.$nsCloudServicesPolicyService.shouldAcceptCloudServicesPolicy()) {
			this.$logger.info(await this.$nsCloudServicesPolicyService.getCloudServicesFullMessage());
			const promptMessage = "Input yes to agree".green + " or " + "leave empty to decline".red.bold + ":";
			const res = await this.$prompter.getString(promptMessage, { allowEmpty: true });

			if (res !== "yes") {
				this.$errors.failWithoutHelp(`You must agree to continue.`);
			} else {
				await this.$nsCloudServicesPolicyService.acceptCloudServicesPolicy();
			}
		}

		return true;
	}
}

$injector.registerCommand("login", LoginCommand);
