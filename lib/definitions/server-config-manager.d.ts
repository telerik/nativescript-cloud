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
	applyConfig(configName: string, options?: IConfigOptions): void;

	getCurrentConfigData(): IServerConfig;

	printConfigData(): void;
}

interface IServerConfig extends IDynamicIndex {
	apiVersion?: string;
	domainName: string;
	serverProto?: string;
	stage?: string;
	cloudEnv?: IStringDictionary;
	cloudServices: IDictionary<ICloudServiceConfig>;
}

interface ICloudServiceConfig extends IDynamicIndex {
	apiVersion?: string;
	fullHostName?: string;
	serverProto?: string;
	subdomain?: string;
	cloudEnv?: IStringDictionary;
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
