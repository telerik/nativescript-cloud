export class ConfigApplyCommand implements ICommand {
	constructor(private $serverConfigManager: IServerConfigManager,
		private $stringParameterBuilder: IStringParameterBuilder) { }

	public allowedParameters: ICommandParameter[] = [this.$stringParameterBuilder.createMandatoryParameter("Configuration name cannot be empty.")];

	public async execute(args: string[]): Promise<void> {
		const configurationName = args[0];
		this.$serverConfigManager.applyConfig(configurationName);
		this.$serverConfigManager.printConfigData();
	}
}

$injector.registerCommand("config|apply", ConfigApplyCommand);
