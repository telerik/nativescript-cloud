export class LoginCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor(private $nsCloudEulaCommandHelper: IEulaCommandHelper,
		private $nsCloudAuthenticationService: IAuthenticationService,
		private $commandsService: ICommandsService,
		private $logger: ILogger,
		private $options: IOptions) { }

	public async execute(args: string[]): Promise<void> {
		await this.$nsCloudEulaCommandHelper.ensureEulaIsAccepted();

		await this.$nsCloudAuthenticationService.login({ timeout: this.$options.timeout });
		this.$logger.info("Successfully logged in.");
		await this.$commandsService.tryExecuteCommand("user", []);
	}
}

$injector.registerCommand("login", LoginCommand);
