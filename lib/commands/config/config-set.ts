export class ConfigApplyCommand implements ICommand {
	constructor(private $nsCloudServerConfigManager: IServerConfigManager,
		private $stringParameterBuilder: IStringParameterBuilder) { }

	public allowedParameters: ICommandParameter[] = [this.$stringParameterBuilder.createMandatoryParameter("You must specify path to configuration file.")];

	public async execute(args: string[]): Promise<void> {
		const configurationFile = args[0];
		this.$nsCloudServerConfigManager.applyConfig(null, { configurationFile: configurationFile });
		this.$nsCloudServerConfigManager.printConfigData();
	}
}

$injector.registerCommand("config|set", ConfigApplyCommand);
