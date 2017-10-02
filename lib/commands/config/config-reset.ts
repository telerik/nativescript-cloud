export class ConfigResetCommand implements ICommand {
	constructor(private $serverConfigManager: IServerConfigManager,
		private $logger: ILogger) { }

	public allowedParameters: ICommandParameter[] = [];

	public async execute(args: string[]): Promise<void> {
		this.$serverConfigManager.reset();
		this.$logger.info("Server configuration successfully reset to:");
		this.$serverConfigManager.printConfigData();
	}
}

$injector.registerCommand("config|reset", ConfigResetCommand);
