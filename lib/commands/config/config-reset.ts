export class ConfigResetCommand implements ICommand {
	constructor(private $nsCloudConfigManager: ICloudConfigManager,
		private $logger: ILogger) { }

	public allowedParameters: ICommandParameter[] = [];

	public async execute(args: string[]): Promise<void> {
		this.$nsCloudConfigManager.reset();
		this.$logger.info("Server configuration successfully reset.");
	}
}

$injector.registerCommand("config|reset", ConfigResetCommand);
