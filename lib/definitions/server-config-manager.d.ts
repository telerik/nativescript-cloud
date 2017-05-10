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
	 * @returns {void}
	 */
	apply(configName: string, options?: IConfigOptions): void;

	getCurrentConfigData(): IServerConfig;

	printConfigData(): void;
}

interface IServerConfig {
	apiVersion?: string;
	domainName: string;
	serverProto?: string;
	stage?: string;
	cloudServices: IDictionary<ICloudServiceConfig>;
	[index: string]: string | IDictionary<ICloudServiceConfig>;
}

interface ICloudServiceConfig {
	apiVersion?: string;
	fullHostName?: string;
	serverProto?: string;
	subdomain?: string;
	[index: string]: string;
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
