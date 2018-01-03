export class ConfigApplyCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [this.$stringParameterBuilder.createMandatoryParameter("Configuration name cannot be empty.")];

	public get dashedOptions() {
		return this.$nsCloudOptionsProvider.dashedOptions;
	}

	constructor(private $nsCloudOptionsProvider: ICloudOptionsProvider,
		private $nsCloudServerConfigManager: IServerConfigManager,
		private $options: ICloudOptions,
		private $stringParameterBuilder: IStringParameterBuilder) { }

	public async execute(args: string[]): Promise<void> {
		const configurationName = args[0];
		const globalServerConfig = { apiVersion: this.$options.apiVersion, serverProto: this.$options.serverProto };
		this.$nsCloudServerConfigManager.applyConfig(configurationName, null, globalServerConfig);
		this.$nsCloudServerConfigManager.printConfigData();
	}
}

$injector.registerCommand("config|apply", ConfigApplyCommand);
