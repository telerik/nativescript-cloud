export class LoginCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor(private $authenticationService: IAuthenticationService,
		private $commandsService: ICommandsService,
		private $logger: ILogger,
		private $options: IOptions) { }

	public async execute(args: string[]): Promise<void> {
		await this.$authenticationService.login({ timeout: this.$options.timeout });
		this.$logger.info("Successfully logged in.");
		await this.$commandsService.tryExecuteCommand("user", []);
	}
}

$injector.registerCommand("login", LoginCommand);
