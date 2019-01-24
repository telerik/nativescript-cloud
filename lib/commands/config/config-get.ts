export class ConfigGetCommand implements ICommand {
	constructor(private $nsCloudConfigManager: ICloudConfigManager) { }

	public allowedParameters: ICommandParameter[] = [];

	public async execute(args: string[]): Promise<void> {
		this.$nsCloudConfigManager.printConfigData();
	}
}

$injector.registerCommand("config|*get", ConfigGetCommand);
