import * as path from "path";

export class CloudConfigManager implements ICloudConfigManager {
	private static CONFIG_FILE_NAME: string = "config";
	private static BASE_CONFIG_FILE_NAME: string = `${CloudConfigManager.CONFIG_FILE_NAME}-base`;

	/* don't require logger and everything that has logger as dependency in config.js due to cyclic dependency */
	constructor(protected $fs: IFileSystem,
		protected $options: IProfileDir) {
		const baseConfigPath = this.getConfigPath(CloudConfigManager.CONFIG_FILE_NAME);

		let serverConfig: IServerConfig = null;
		if (this.$fs.exists(baseConfigPath)) {
			serverConfig = this.getCurrentConfigData();
		} else {
			serverConfig = this.loadConfig(CloudConfigManager.BASE_CONFIG_FILE_NAME);
		}

		this.mergeConfig(this, serverConfig);
	}

	public reset(): void {
		this.applyConfig("production");
	}

	public applyConfig(configName: string, options?: IConfigOptions, globalServerConfig?: IServerConfigBase): void {
		const baseConfig = this.loadConfig(CloudConfigManager.BASE_CONFIG_FILE_NAME);
		const newConfig = this.loadConfig(`${CloudConfigManager.CONFIG_FILE_NAME}-${configName}`, options);
		this.mergeConfig(baseConfig, newConfig, globalServerConfig);
		this.saveConfig(baseConfig, CloudConfigManager.CONFIG_FILE_NAME);
	}

	public printConfigData(): void {
		const config = this.getCurrentConfigData();
		console.log(JSON.stringify(config, null, 2));
	}

	public getCurrentConfigData(): IServerConfig {
		return this.loadConfig(CloudConfigManager.CONFIG_FILE_NAME);
	}

	public getServiceDomainName(serviceName: string): string {
		const config = this.getCurrentConfigData();
		const serviceConfig = config.cloudServices[serviceName];
		// When we want to use localhost or PR builds for cloud services
		// we need to return the specified full domain name.
		if (serviceConfig.fullHostName) {
			return serviceConfig.fullHostName;
		}

		// If we want to use the official domains we need the domain name and the subdomain for the service.
		return `${serviceConfig.subdomain}.${config.domainName}`;
	}

	public getServiceValueOrDefault(serviceName: string, valueName: string): string {
		const config = this.getCurrentConfigData();
		const serviceConfig = config.cloudServices[serviceName];
		if (_.has(serviceConfig, valueName)) {
			return serviceConfig[valueName];
		}

		return <string>config[valueName];
	}

	public getCloudServicesDomainNames(): string[] {
		const cloudServices = this.getCurrentConfigData().cloudServices;

		return _(cloudServices)
			.keys()
			.map(s => this.getServiceDomainName(s))
			.value();
	}

	private loadConfig(name: string, options?: IConfigOptions): IServerConfig {
		const configFileName = this.getConfigPath(name, options);
		return this.$fs.readJson(configFileName);
	}

	private getConfigPath(filename: string, options?: IConfigOptions): string {
		if (options && options.configurationFile) {
			return options.configurationFile;
		}

		const dirname = path.join(__dirname, "../server-configs/");
		return path.join(dirname, filename + ".json");
	}

	private saveConfig(config: IServerConfig, name: string): void {
		const configNoFunctions = Object.create(null);
		_.each(<any>config, (entry, key) => {
			if (typeof entry !== "function") {
				configNoFunctions[key] = entry;
			}
		});

		const configFileName = this.getConfigPath(name);
		return this.$fs.writeJson(configFileName, configNoFunctions);
	}

	private mergeConfig(config: any, mergeFrom: IServerConfig, globalServerConfig?: IServerConfigBase): void {
		_.extend(config, mergeFrom);
		if (globalServerConfig) {
			const filteredGlobalConfig = _.omitBy(globalServerConfig, _.isUndefined);
			_.extend(config, filteredGlobalConfig);
		}
	}
}

$injector.register("nsCloudConfigManager", CloudConfigManager);
