import * as path from "path";

export class ServerConfigManager implements IServerConfigManager {
	private static CONFIG_FILE_NAME: string = "config";
	private static BASE_CONFIG_FILE_NAME: string = `${ServerConfigManager.CONFIG_FILE_NAME}-base`;

	/*don't require logger and everything that has logger as dependency in config.js due to cyclic dependency*/
	constructor(protected $fs: IFileSystem,
		protected $options: IProfileDir) {
		const baseConfigPath = this.getConfigPath(ServerConfigManager.CONFIG_FILE_NAME);

		let serverConfig: IServerConfig = null;
		if (this.$fs.exists(baseConfigPath)) {
			serverConfig = this.getCurrentConfigData();
		} else {
			serverConfig = this.loadConfig(ServerConfigManager.BASE_CONFIG_FILE_NAME);
		}

		this.mergeConfig(this, serverConfig);
	}

	public reset(): void {
		this.applyConfig("production");
	}

	public applyConfig(configName: string, options?: IConfigOptions, globalServerConfig?: IServerConfigBase): void {
		const baseConfig = this.loadConfig(ServerConfigManager.BASE_CONFIG_FILE_NAME);
		const newConfig = this.loadConfig(`${ServerConfigManager.CONFIG_FILE_NAME}-${configName}`, options);
		this.mergeConfig(baseConfig, newConfig, globalServerConfig);
		this.saveConfig(baseConfig, ServerConfigManager.CONFIG_FILE_NAME);
	}

	public printConfigData(): void {
		const config = this.getCurrentConfigData();
		console.log(JSON.stringify(config, null, "  "));
	}

	public getCurrentConfigData(): IServerConfig {
		return this.loadConfig(ServerConfigManager.CONFIG_FILE_NAME);
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

$injector.register("nsCloudServerConfigManager", ServerConfigManager);
