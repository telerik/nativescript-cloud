interface IServerConfigManager {
	/**
	 * Resets config.json to it's default values.
	 * @returns {void}
	 */
	reset(): void;

	/**
	 * Applies specific configuration and saves it in config.json
	 * @param {string} configName The name of the configuration to be applied.
	 * @param optional {IConfigOptions} options The config options.
	 * @param optional {IServerConfigBase} globalServerConfig The global server configuration which will
	 * be used when changing the configuration. This parameter will override the default global configuration.
	 * @returns {void}
	 */
	applyConfig(configName: string, options?: IConfigOptions, globalServerConfig?: IServerConfigBase): void;

	getCurrentConfigData(): IServerConfig;

	printConfigData(): void;
}

interface IServerConfigBase {
	apiVersion?: string;
	serverProto?: string;
	namespace?: string;
}

interface IServerConfig extends IServerConfigBase {
	domainName: string;
	stage?: string;
	cloudServices: IDictionary<ICloudServiceConfig>;
	mBaaS: IDictionary<IMBaaSConfig>;
	[index: string]: string | IDictionary<ICloudServiceConfig> | IDictionary<IMBaaSConfig>;
}

interface ICloudServiceConfig extends IServerConfigBase {
	fullHostName?: string;
	subdomain?: string;
	[index: string]: string;
}

interface IMBaaSConfig {
	fullHostName: string;
	apiVersion: string;
	authScheme?: string;
}

/**
 * Describes options that can be passed to load/get configuration methods
 */
interface IConfigOptions {
	/**
	 * Path to the configuration file to load.
	 */
	configurationFile?: string;
}
