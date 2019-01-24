export class ConfigApplyCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [this.$stringParameterBuilder.createMandatoryParameter("You must specify path to configuration file.")];

	public get dashedOptions() {
		return this.$nsCloudOptionsProvider.dashedOptions;
	}

	constructor(private $nsCloudOptionsProvider: ICloudOptionsProvider,
		private $nsCloudConfigManager: ICloudConfigManager,
		private $options: ICloudOptions,
		private $stringParameterBuilder: IStringParameterBuilder) { }

	public async execute(args: string[]): Promise<void> {
		const configurationFile = args[0];
		const globalServerConfig: IServerConfigBase = { apiVersion: this.$options.apiVersion, serverProto: this.$options.serverProto };
		this.$nsCloudConfigManager.applyConfig(null, { configurationFile }, globalServerConfig);
		this.$nsCloudConfigManager.printConfigData();
	}
}

$injector.registerCommand("config|set", ConfigApplyCommand);
