interface ICloudConfigManager {
	/**
	 * Resets config.json to it's default values.
	 * @returns {void}
	 */
	reset(): void;

	/**
	 * Applies specific configuration and saves it in config.json
	 * @param {string} configName The name of the configuration to be applied.
	 * @param {IConfigOptions} [options] The config options.
	 * @param {IServerConfigBase} [globalServerConfig] The global server configuration which will
	 * be used when changing the configuration. This parameter will override the default global configuration.
	 * @returns {void}
	 */
	applyConfig(configName: string, options?: IConfigOptions, globalServerConfig?: IServerConfigBase): void;

	/**
	 * Returns the current cloud configuration.
	 * @returns {IServerConfig}
	 */
	getCurrentConfigData(): IServerConfig;

	/**
	 * Returns the domain of the provided cloud service.
	 * @param serviceName The name of the cloud service.
	 * @returns {string}
	 */
	getServiceDomainName(serviceName: string): string;

	/**
	 * Returns the domain names of all cloud services.
	 * @returns {string[]} The domain names of all cloud services.
	 */
	getCloudServicesDomainNames(): string[];

	/**
	 * Returns the value stored in the configuration of the provided service or the default value stored in the
	 * global configuration.
	 * @param serviceName The name of the cloud service.
	 * @param valueName The name of the value.
	 * @returns {string} The value specified in the provided service config or the value specified in the global config.
	 */
	getServiceValueOrDefault(serviceName: string, valueName: string): string;

	/**
	 * Prints the current cloud configuration on the stdout of the process.
	 * @returns {void}
	 */
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
