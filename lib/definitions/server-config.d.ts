interface IServerConfiguration extends IConfiguration {
	USE_CDN_FOR_EXTENSION_DOWNLOAD: boolean;

	/**
	 * Resets config.json to it's default values.
	 * @returns {void}
	 */
	reset(): void;

	/**
	 * Applies specific configuration and saves it in config.json
	 * @param {string} configName The name of the configuration to be applied.
	 * @returns {void}
	 */
	apply(configName: string): void;
	printConfigData(): void;
}

/**
 * Describes options that can be passed to load/get configuration methods
 */
interface IConfigOptions {
	/**
	 * Whether to load/get a local path (i.e. from within this package) or from a global one
	 */
	local: boolean;
}
