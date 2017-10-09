export class ConfigResetCommand implements ICommand {
	constructor(private $nsCloudServerConfigManager: IServerConfigManager,
		private $logger: ILogger) { }

	public allowedParameters: ICommandParameter[] = [];

	public async execute(args: string[]): Promise<void> {
		this.$nsCloudServerConfigManager.reset();
		this.$logger.info("Server configuration successfully reset.");
	}
}

$injector.registerCommand("config|reset", ConfigResetCommand);
