export class DevLoginCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [
		this.$stringParameterBuilder.createMandatoryParameter("Missing user name or password."),
		this.$stringParameterBuilder.createMandatoryParameter("Missing user name or password.")
	];

	constructor(private $errors: IErrors,
		private $logger: ILogger,
		private $nsCloudAuthenticationService: IAuthenticationService,
		private $nsCloudServicesPolicyService: ICloudServicesPolicyService,
		private $stringParameterBuilder: IStringParameterBuilder) { }

	public async execute(args: string[]): Promise<void> {
		if (await this.$nsCloudServicesPolicyService.shouldAcceptCloudServicesPolicy()) {
			this.$logger.info(await this.$nsCloudServicesPolicyService.getCloudServicesFullMessage());
		}

		try {
			await this.$nsCloudAuthenticationService.devLogin(args[0], args[1]);
		} catch (err) {
			this.$errors.failWithoutHelp(err.message);
		}

		this.$logger.info("Successfully logged in.");
	}
}

$injector.registerCommand("dev-login", DevLoginCommand);
