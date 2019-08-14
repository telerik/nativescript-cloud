import { InteractiveCloudCommand } from "./interactive-cloud-command";

export class CloudDeploy extends InteractiveCloudCommand implements ICommand {
	public allowedParameters: ICommandParameter[];

	public get dashedOptions() {
		return this.$nsCloudOptionsProvider.dashedOptions;
	}

	constructor($nsCloudProcessService: IProcessService,
		protected $nsCloudErrorsService: IErrors,
		protected $logger: ILogger,
		protected $prompter: IPrompter,
		private $nsCloudEulaCommandHelper: IEulaCommandHelper,
		private $nsCloudPlatformService: ICloudPlatformService,
		private $nsCloudBuildCommandHelper: IBuildCommandHelper,
		private $nsCloudBuildService: ICloudBuildService,
		private $nsCloudOptionsProvider: ICloudOptionsProvider,
		private $options: ICloudOptions,
		private $projectData: IProjectData,
		private $nsCloudAndroidBundleValidatorHelper: IAndroidBundleValidatorHelper) {
		super($nsCloudBuildService, $nsCloudProcessService, $nsCloudErrorsService, $logger, $prompter);
		this.$projectData.initializeProjectData();
	}

	public async canExecute(args: string[]): Promise<boolean> {
		await this.$nsCloudEulaCommandHelper.ensureEulaIsAccepted();
		this.$nsCloudAndroidBundleValidatorHelper.validateNoAab();

		if (!args || !args.length) {
			this.$nsCloudErrorsService.failWithHelp("Provide platform.");
		}

		if (args.length > 1) {
			this.$nsCloudErrorsService.failWithHelp("Only a single platform is supported.");
		}

		return true;
	}

	protected executeCore(args: string[]): Promise<void> {
		const buildData = this.$nsCloudBuildCommandHelper.getCloudBuildData(args[0]);
		const outputDirectoryPath = this.$nsCloudBuildService.getServerOperationOutputDirectory({
			platform: buildData.platform,
			projectDir: this.$projectData.projectDir,
			emulator: this.$options.emulator
		});

		return this.$nsCloudPlatformService.deployPlatform(args[0], outputDirectoryPath);
	}
}

$injector.registerCommand(["deploy|cloud", "cloud|deploy"], CloudDeploy);
