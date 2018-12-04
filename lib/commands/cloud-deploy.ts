import { BundleValidatorBaseCommand } from "./bundle-validator-base-command";

export class CloudDeploy extends BundleValidatorBaseCommand implements ICommand {
	public allowedParameters: ICommandParameter[];

	public get dashedOptions() {
		return this.$nsCloudOptionsProvider.dashedOptions;
	}

	constructor($nsCloudPolyfillService: IPolyfillService,
		private $platformService: IPlatformService,
		private $nsCloudEulaCommandHelper: IEulaCommandHelper,
		private $errors: IErrors,
		private $deployCommandHelper: IDeployCommandHelper,
		private $nsCloudBuildCommandHelper: IBuildCommandHelper,
		private $nsCloudBuildService: ICloudBuildService,
		private $nsCloudOptionsProvider: ICloudOptionsProvider,
		private $options: ICloudOptions,
		private $projectData: IProjectData,
		private $nsCloudAndroidBundleValidatorHelper: IAndroidBundleValidatorHelper) {
		super($nsCloudPolyfillService);
		this.$projectData.initializeProjectData();
	}

	public execute(args: string[]): Promise<void> {
		const buildData = this.$nsCloudBuildCommandHelper.getCloudBuildData(args[0]);
		const outputDirectoryPath = this.$nsCloudBuildService.getServerOperationOutputDirectory({
			platform: buildData.platform,
			projectDir: this.$projectData.projectDir,
			emulator: this.$options.emulator
		});

		const deployPlatformInfo = this.$deployCommandHelper.getDeployPlatformInfo(args[0]);
		deployPlatformInfo.buildPlatform = this.$nsCloudBuildCommandHelper.buildPlatform.bind(this.$nsCloudBuildCommandHelper);
		deployPlatformInfo.outputPath = outputDirectoryPath;
		deployPlatformInfo.nativePrepare = { skipNativePrepare: true };

		return this.$platformService.deployPlatform(deployPlatformInfo);
	}

	public async canExecute(args: string[]): Promise<boolean> {
		this.$bundleValidatorHelper.validate();
		await this.$nsCloudEulaCommandHelper.ensureEulaIsAccepted();
		this.$nsCloudAndroidBundleValidatorHelper.validateNoAab();

		if (!args || !args.length) {
			this.$errors.fail("Provide platform.");
		}

		if (args.length > 1) {
			this.$errors.fail("Only a single platform is supported.");
		}

		return true;
	}
}

$injector.registerCommand(["deploy|cloud", "cloud|deploy"], CloudDeploy);
