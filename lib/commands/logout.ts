export class LogoutCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor(private $nsCloudAuthenticationService: IAuthenticationService,
		private $logger: ILogger) { }

	public async execute(args: string[]): Promise<void> {
		this.$nsCloudAuthenticationService.logout();
		this.$logger.info("Successfully logged out.");
	}
}

$injector.registerCommand("logout", LogoutCommand);
