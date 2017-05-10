export class ConfigGetCommand implements ICommand {
	constructor(private $serverConfigManager: IServerConfigManager) { }

	public allowedParameters: ICommandParameter[] = [];

	public async execute(args: string[]): Promise<void> {
		this.$serverConfigManager.printConfigData();
	}
}

$injector.registerCommand("config|*get", ConfigGetCommand);
