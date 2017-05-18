export class LogoutCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor(private $authenticationService: IAuthenticationService,
		private $logger: ILogger) { }

	public async execute(args: string[]): Promise<void> {
		this.$authenticationService.logout();
		this.$logger.info("Successfully logged out.");
	}
}

$injector.registerCommand("logout", LogoutCommand);
