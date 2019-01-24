export class ConfigApplyCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [this.$stringParameterBuilder.createMandatoryParameter("Configuration name cannot be empty.")];

	public get dashedOptions() {
		return this.$nsCloudOptionsProvider.dashedOptions;
	}

	constructor(private $nsCloudOptionsProvider: ICloudOptionsProvider,
		private $nsCloudConfigManager: ICloudConfigManager,
		private $options: ICloudOptions,
		private $stringParameterBuilder: IStringParameterBuilder) { }

	public async execute(args: string[]): Promise<void> {
		const configurationName = args[0];
		const globalServerConfig: IServerConfigBase = { apiVersion: this.$options.apiVersion, serverProto: this.$options.serverProto, namespace: this.$options.namespace };
		this.$nsCloudConfigManager.applyConfig(configurationName, null, globalServerConfig);
		this.$nsCloudConfigManager.printConfigData();
	}
}

$injector.registerCommand("config|apply", ConfigApplyCommand);
