export class DevLoginCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [
		this.$stringParameterBuilder.createMandatoryParameter("Missing user name or password."),
		this.$stringParameterBuilder.createMandatoryParameter("Missing user name or password.")
	];

	constructor(private $nsCloudAuthenticationService: IAuthenticationService,
		private $errors: IErrors,
		private $logger: ILogger,
		private $stringParameterBuilder: IStringParameterBuilder) { }

	public async execute(args: string[]): Promise<void> {
		try {
			await this.$nsCloudAuthenticationService.devLogin(args[0], args[1]);
		} catch (err) {
			this.$errors.failWithoutHelp(err.message);
		}

		this.$logger.info("Successfully logged in.");
	}
}

$injector.registerCommand("dev-login", DevLoginCommand);
