export class ConfigApplyCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [this.$stringParameterBuilder.createMandatoryParameter("You must specify path to configuration file.")];

	public get dashedOptions() {
		return this.$nsCloudOptionsProvider.dashedOptions;
	}

	constructor(private $nsCloudOptionsProvider: ICloudOptionsProvider,
		private $nsCloudServerConfigManager: IServerConfigManager,
		private $options: ICloudOptions,
		private $stringParameterBuilder: IStringParameterBuilder) { }

	public async execute(args: string[]): Promise<void> {
		const configurationFile = args[0];
		const globalServerConfig: IServerConfigBase = { apiVersion: this.$options.apiVersion, serverProto: this.$options.serverProto };
		this.$nsCloudServerConfigManager.applyConfig(null, { configurationFile }, globalServerConfig);
		this.$nsCloudServerConfigManager.printConfigData();
	}
}

$injector.registerCommand("config|set", ConfigApplyCommand);
