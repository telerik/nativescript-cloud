export class ConfigGetCommand implements ICommand {
	constructor(private $nsCloudServerConfigManager: IServerConfigManager) { }

	public allowedParameters: ICommandParameter[] = [];

	public async execute(args: string[]): Promise<void> {
		this.$nsCloudServerConfigManager.printConfigData();
	}
}

$injector.registerCommand("config|*get", ConfigGetCommand);
