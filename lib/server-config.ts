import * as path from "path";

export class ServerConfiguration implements IServerConfiguration { // User specific config
	DISABLE_HOOKS: boolean = false;
	AB_SERVER_PROTO: string;
	AB_SERVER: string;
	DEBUG: boolean;
	USE_PROXY: boolean;
	PROXY_HOSTNAME: string;
	PROXY_PORT: number;
	ON_PREM: boolean;
	DEFAULT_CORDOVA_PROJECT_TEMPLATE: string;
	DEFAULT_NATIVESCRIPT_PROJECT_TEMPLATE: string;
	CORDOVA_PLUGINS_REGISTRY: string;
	CI_LOGGER: boolean;
	USE_CDN_FOR_EXTENSION_DOWNLOAD: boolean;
	AUTO_UPGRADE_PROJECT_FILE: boolean;
	TYPESCRIPT_COMPILER_OPTIONS: ITypeScriptCompilerOptions;
	ANDROID_DEBUG_UI: any;
	USE_POD_SANDBOX: any;
	debugLivesync: boolean;

	/*don't require logger and everything that has logger as dependency in config.js due to cyclic dependency*/
	constructor(protected $fs: IFileSystem,
		protected $options: IProfileDir) {
		let baseConfigPath = this.getConfigPath("config");

		let serverConfig: IServerConfiguration = null;
		if (this.$fs.exists(baseConfigPath)) {
			serverConfig = this.loadConfig("config");
		} else {
			serverConfig = this.loadConfig("config-base", { local: true });
		}

		this.mergeConfig(this, serverConfig);
	}

	public reset(): void {
		return this.$fs.copyFile(this.getConfigPath("config-base"), this.getConfigPath("config"));
	}

	public apply(configName: string): void {
		let baseConfig = this.loadConfig("config-base");
		let newConfig = this.loadConfig("config-" + configName);
		this.mergeConfig(baseConfig, newConfig);
		this.saveConfig(baseConfig, "config");
	}

	public printConfigData(): void {
		let config = this.loadConfig("config");
		console.log(config);
	}

	protected loadConfig(name: string, options?: IConfigOptions): any {
		let configFileName = this.getConfigPath(name, options);
		return this.$fs.readJson(configFileName);
	}

	protected getConfigPath(filename: string, options?: IConfigOptions): string {
		let dirname = options && options.local ? path.join(__dirname, "../server-configs/") : this.$options.profileDir;
		return path.join(dirname, filename + ".json");
	}

	private saveConfig(config: IServerConfiguration, name: string): void {
		let configNoFunctions = Object.create(null);
		_.each(<any>config, (entry, key) => {
			if (typeof entry !== "function") {
				configNoFunctions[key] = entry;
			}
		});

		let configFileName = this.getConfigPath(name);
		return this.$fs.writeJson(configFileName, configNoFunctions);
	}

	private mergeConfig(config: any, mergeFrom: IServerConfiguration): void {
		_.extend(config, mergeFrom);
	}

}
$injector.register("serverConfig", ServerConfiguration);

// export class StaticConfig implements IStaticConfig {
// 	constructor($injector: IInjector) {
// 		this.RESOURCE_DIR_PATH = path.join(this.RESOURCE_DIR_PATH, "../../resources");
// 	}

// 	public RESOURCE_DIR_PATH: string = "";
// 	private static TOKEN_FILENAME = ".abgithub";
// 	public PROJECT_FILE_NAME = ".abproject";
// 	public CLIENT_NAME = "AppBuilder";
// 	public ANALYTICS_API_KEY = "13eaa7db90224aa1861937fc71863ab8";
// 	public ANALYTICS_FEATURE_USAGE_TRACKING_API_KEY = "13eaa7db90224aa1861937fc71863ab8";
// 	public TRACK_FEATURE_USAGE_SETTING_NAME = "AnalyticsSettings.TrackFeatureUsage";
// 	public ERROR_REPORT_SETTING_NAME = "AnalyticsSettings.TrackExceptions";
// 	public ANALYTICS_INSTALLATION_ID_SETTING_NAME = "AnalyticsInstallationID";
// 	public SYS_REQUIREMENTS_LINK = "http://docs.telerik.com/platform/appbuilder/running-appbuilder/running-the-cli/system-requirements-cli";
// 	public SOLUTION_SPACE_NAME = "Private_Build_Folder";
// 	public FULL_CLIENT_NAME = "Telerik AppBuilder CLI by Progress";
// 	public QR_SIZE = 300;
// 	public get GITHUB_ACCESS_TOKEN_FILEPATH(): string {
// 		return path.join(osenv.home(), StaticConfig.TOKEN_FILENAME);
// 	}

// 	public version = require("../package.json").version;

// 	public triggerJsonSchemaValidation = true;

// 	public get helpTextPath() {
// 		return path.join(__dirname, "../resources/help.txt");
// 	}

// 	public get HTML_CLI_HELPERS_DIR(): string {
// 		return path.join(__dirname, "../docs/helpers");
// 	}

// 	public get pathToPackageJson(): string {
// 		return path.join(__dirname, "..", "package.json");
// 	}

// 	public get PATH_TO_BOOTSTRAP(): string {
// 		return path.join(__dirname, "bootstrap");
// 	}
// }
// $injector.register("staticConfig", StaticConfig);
