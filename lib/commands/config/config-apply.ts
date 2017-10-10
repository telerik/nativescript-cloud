export class ConfigApplyCommand implements ICommand {
	constructor(private $nsCloudServerConfigManager: IServerConfigManager,
		private $stringParameterBuilder: IStringParameterBuilder) { }

	public allowedParameters: ICommandParameter[] = [this.$stringParameterBuilder.createMandatoryParameter("Configuration name cannot be empty.")];

	public async execute(args: string[]): Promise<void> {
		const configurationName = args[0];
		this.$nsCloudServerConfigManager.applyConfig(configurationName);
		this.$nsCloudServerConfigManager.printConfigData();
	}
}

$injector.registerCommand("config|apply", ConfigApplyCommand);
