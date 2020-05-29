import { InteractiveCloudCommand } from "./interactive-cloud-command";

export class CloudRunCommand extends InteractiveCloudCommand implements ICommand {
	public allowedParameters: ICommandParameter[];

	public get dashedOptions() {
		return this.$nsCloudOptionsProvider.dashedOptions;
	}

	public platform: string;
	constructor($nsCloudProcessService: IProcessService,
		protected $nsCloudErrorsService: IErrors,
		protected $logger: ILogger,
		protected $prompter: IPrompter,
		private $liveSyncCommandHelper: ILiveSyncCommandHelper,
		private $nsCloudEulaCommandHelper: IEulaCommandHelper,
		private $nsCloudBuildService: ICloudBuildService,
		private $nsCloudBuildCommandHelper: IBuildCommandHelper,
		private $nsCloudOptionsProvider: ICloudOptionsProvider,
		private $nsCloudPolyfillService: IPolyfillService,
		private $options: IOptions,
		private $projectData: IProjectData,
		private $nsCloudAndroidBundleValidatorHelper: IAndroidBundleValidatorHelper) {
		super($nsCloudBuildService, $nsCloudProcessService, $nsCloudErrorsService, $logger, $prompter);
		this.$projectData.initializeProjectData();

		if (!this.$options.justlaunch) {
			const cleanupService: ICleanupService = this.$nsCloudPolyfillService.getPolyfillObject("cleanupService", { setShouldDispose: () => { /* ¯\_(ツ)_/¯ */ } });
			cleanupService.setShouldDispose(true);
		}
	}

	public async canExecute(args: string[]): Promise<boolean> {
		(<INSCloudGlobal>global).showErrorForStoppedCloudBuilds();
		await this.$nsCloudEulaCommandHelper.ensureEulaIsAccepted();
		this.$nsCloudAndroidBundleValidatorHelper.validateNoAab();

		if (args.length) {
			this.$nsCloudErrorsService.failWithHelp("This input is not valid for the cloud run command");
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
		$nsCloudPolyfillService: IPolyfillService,
		$nsCloudProcessService: IProcessService,
		$options: IOptions,
		$projectData: IProjectData,
		$nsCloudAndroidBundleValidatorHelper: IAndroidBundleValidatorHelper,
		protected $nsCloudErrorsService: IErrors,
		protected $logger: ILogger,
		protected $prompter: IPrompter,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants) {
		super($nsCloudProcessService, $nsCloudErrorsService, $logger, $prompter, $liveSyncCommandHelper, $nsCloudEulaCommandHelper, $nsCloudBuildService, $nsCloudBuildCommandHelper, $nsCloudOptionsProvider, $nsCloudPolyfillService, $options, $projectData, $nsCloudAndroidBundleValidatorHelper);
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
		$nsCloudPolyfillService: IPolyfillService,
		$nsCloudProcessService: IProcessService,
		$options: IOptions,
		$projectData: IProjectData,
		$nsCloudAndroidBundleValidatorHelper: IAndroidBundleValidatorHelper,
		protected $nsCloudErrorsService: IErrors,
		protected $logger: ILogger,
		protected $prompter: IPrompter,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants) {
		super($nsCloudProcessService, $nsCloudErrorsService, $logger, $prompter, $liveSyncCommandHelper, $nsCloudEulaCommandHelper, $nsCloudBuildService, $nsCloudBuildCommandHelper, $nsCloudOptionsProvider, $nsCloudPolyfillService, $options, $projectData, $nsCloudAndroidBundleValidatorHelper);
	}
}

$injector.registerCommand(["run|cloud|android", "cloud|run|android"], CloudRunAndroidCommand);
