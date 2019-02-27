import { InteractiveCloudCommand } from "./interactive-cloud-command";

export class CloudRunCommand extends InteractiveCloudCommand implements ICommand {
	public allowedParameters: ICommandParameter[];

	public get dashedOptions() {
		return this.$nsCloudOptionsProvider.dashedOptions;
	}

	public platform: string;
	constructor($processService: IProcessService,
		protected $errors: IErrors,
		protected $logger: ILogger,
		protected $prompter: IPrompter,
		private $liveSyncCommandHelper: ILiveSyncCommandHelper,
		private $nsCloudEulaCommandHelper: IEulaCommandHelper,
		private $nsCloudBuildService: ICloudBuildService,
		private $nsCloudBuildCommandHelper: IBuildCommandHelper,
		private $nsCloudOptionsProvider: ICloudOptionsProvider,
		private $projectData: IProjectData,
		private $nsCloudAndroidBundleValidatorHelper: IAndroidBundleValidatorHelper) {
		super($nsCloudBuildService, $processService, $errors, $logger, $prompter);
		this.$projectData.initializeProjectData();
	}

	public async canExecute(args: string[]): Promise<boolean> {
		await this.$nsCloudEulaCommandHelper.ensureEulaIsAccepted();
		this.$nsCloudAndroidBundleValidatorHelper.validateNoAab();

		if (args.length) {
			this.$errors.fail("This input is not valid for the cloud run command");
		}

		return true;
	}

	protected async executeCore(args: string[]): Promise<void> {
		return this.$liveSyncCommandHelper.executeCommandLiveSync(this.platform, {
			getOutputDirectory: this.$nsCloudBuildService.getServerOperationOutputDirectory.bind(this.$nsCloudBuildService),
			buildPlatform: this.$nsCloudBuildCommandHelper.buildPlatform.bind(this.$nsCloudBuildCommandHelper),
			skipNativePrepare: true
		});
	}
}

$injector.registerCommand(["run|cloud|*all", "cloud|run|*all"], CloudRunCommand);

export class CloudRunIosCommand extends CloudRunCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];
	public get platform(): string {
		return this.$devicePlatformsConstants.iOS;
	}

	constructor($liveSyncCommandHelper: ILiveSyncCommandHelper,
		$nsCloudEulaCommandHelper: IEulaCommandHelper,
		$nsCloudBuildCommandHelper: IBuildCommandHelper,
		$nsCloudBuildService: ICloudBuildService,
		$nsCloudOptionsProvider: ICloudOptionsProvider,
		$processService: IProcessService,
		$projectData: IProjectData,
		$nsCloudAndroidBundleValidatorHelper: IAndroidBundleValidatorHelper,
		protected $errors: IErrors,
		protected $logger: ILogger,
		protected $prompter: IPrompter,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants) {
		super($processService, $errors, $logger, $prompter, $liveSyncCommandHelper, $nsCloudEulaCommandHelper, $nsCloudBuildService, $nsCloudBuildCommandHelper, $nsCloudOptionsProvider, $projectData, $nsCloudAndroidBundleValidatorHelper);
	}
}

$injector.registerCommand(["run|cloud|ios", "cloud|run|ios"], CloudRunIosCommand);

export class CloudRunAndroidCommand extends CloudRunCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];
	public get platform(): string {
		return this.$devicePlatformsConstants.Android;
	}

	constructor($liveSyncCommandHelper: ILiveSyncCommandHelper,
		$nsCloudEulaCommandHelper: IEulaCommandHelper,
		$nsCloudBuildCommandHelper: IBuildCommandHelper,
		$nsCloudBuildService: ICloudBuildService,
		$nsCloudOptionsProvider: ICloudOptionsProvider,
		$processService: IProcessService,
		$projectData: IProjectData,
		$nsCloudAndroidBundleValidatorHelper: IAndroidBundleValidatorHelper,
		protected $errors: IErrors,
		protected $logger: ILogger,
		protected $prompter: IPrompter,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants) {
		super($processService, $errors, $logger, $prompter, $liveSyncCommandHelper, $nsCloudEulaCommandHelper, $nsCloudBuildService, $nsCloudBuildCommandHelper, $nsCloudOptionsProvider, $projectData, $nsCloudAndroidBundleValidatorHelper);
	}
}

$injector.registerCommand(["run|cloud|android", "cloud|run|android"], CloudRunAndroidCommand);
