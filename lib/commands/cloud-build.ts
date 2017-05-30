import * as path from "path";
export class CloudBuild implements ICommand {
	public allowedParameters: ICommandParameter[];

	constructor(private $errors: IErrors,
		private $logger: ILogger,
		private $mobileHelper: Mobile.IMobileHelper,
		private $projectData: IProjectData,
		private $cloudBuildService: ICloudBuildService,
		private $options: IOptions,
		private $fs: IFileSystem) {
		this.$projectData.initializeProjectData();
	}

	public async execute(args: string[]): Promise<void> {
		const platform = this.$mobileHelper.validatePlatformName(args[0]);
		this.$logger.warn(`Executing cloud build with platform: ${platform}.`);
		const nativescriptData = this.$fs.readJson(path.join(this.$projectData.projectDir, "package.json")).nativescript;
		let pathToCertificate = "";
		if (this.$mobileHelper.isAndroidPlatform(platform)) {
			pathToCertificate = this.$options.keyStorePath ? path.resolve(this.$options.keyStorePath) : "";
		} else if (this.$mobileHelper.isiOSPlatform(platform)) {
			pathToCertificate = this.$options.certificate ? path.resolve(this.$options.certificate) : "";
		} else {
			this.$errors.failWithoutHelp(`Currently only ${this.$mobileHelper.platformNames.join(' ')} platforms are supported.`);
		}

		const pathToProvision = this.$options.provision ? path.resolve(this.$options.provision) : "";
		const projectSettings = { projectDir: this.$projectData.projectDir, projectId: this.$projectData.projectId, projectName: this.$projectData.projectName, nativescriptData, clean: this.$options.clean };
		const buildConfiguration = this.$options.release ? "Release" : "Debug";
		await this.$cloudBuildService.build(projectSettings,
			platform, buildConfiguration,
			{ pathToCertificate, certificatePassword: this.$options.keyStorePassword },
			{ pathToCertificate, certificatePassword: this.$options.certificatePassword, pathToProvision, buildForDevice: !this.$options.emulator });
	}

	public async canExecute(args: string[]): Promise<boolean> {
		if (!args || !args.length) {
			this.$errors.fail("Provide platform.");
		}

		if (args.length > 1) {
			this.$errors.fail("Only a single platform is supported.");
		}

		return true;
	}
}

$injector.registerCommand("build|cloud", CloudBuild);
