export class CloudRunCommand implements ICommand {
	public allowedParameters: ICommandParameter[];

	public get dashedOptions() {
		return this.$nsCloudOptionsProvider.dashedOptions;
	}

	public platform: string;
	constructor(private $liveSyncCommandHelper: ILiveSyncCommandHelper,
		private $nsCloudEulaCommandHelper: IEulaCommandHelper,
		private $nsCloudBuildService: ICloudBuildService,
		private $nsCloudBuildCommandHelper: IBuildCommandHelper,
		private $errors: IErrors,
		private $nsCloudOptionsProvider: ICloudOptionsProvider,
		private $projectData: IProjectData,
		private $nsCloudAndroidBundleValidatorHelper: IAndroidBundleValidatorHelper) {
		this.$projectData.initializeProjectData();
	}

	public async execute(args: string[]): Promise<void> {
		return this.$liveSyncCommandHelper.executeCommandLiveSync(this.platform, {
			getOutputDirectory: this.$nsCloudBuildService.getServerOperationOutputDirectory.bind(this.$nsCloudBuildService),
			buildPlatform: this.$nsCloudBuildCommandHelper.buildPlatform.bind(this.$nsCloudBuildCommandHelper),
			skipNativePrepare: true
		});
	}

	public async canExecute(args: string[]): Promise<boolean> {
		await this.$nsCloudEulaCommandHelper.ensureEulaIsAccepted();
		this.$nsCloudAndroidBundleValidatorHelper.validateNoAab();

		if (args.length) {
			this.$errors.fail("This input is not valid for the cloud run command");
		}

		return true;
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
		$errors: IErrors,
		$nsCloudBuildCommandHelper: IBuildCommandHelper,
		$nsCloudBuildService: ICloudBuildService,
		$nsCloudOptionsProvider: ICloudOptionsProvider,
		$devicesService: Mobile.IDevicesService,
		$projectData: IProjectData,
		$nsCloudAndroidBundleValidatorHelper: IAndroidBundleValidatorHelper,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants) {
		super($liveSyncCommandHelper, $nsCloudEulaCommandHelper, $nsCloudBuildService, $nsCloudBuildCommandHelper, $errors, $nsCloudOptionsProvider, $projectData, $nsCloudAndroidBundleValidatorHelper);
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
		$errors: IErrors,
		$nsCloudBuildCommandHelper: IBuildCommandHelper,
		$nsCloudBuildService: ICloudBuildService,
		$nsCloudOptionsProvider: ICloudOptionsProvider,
		$devicesService: Mobile.IDevicesService,
		$projectData: IProjectData,
		$nsCloudAndroidBundleValidatorHelper: IAndroidBundleValidatorHelper,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants) {
		super($liveSyncCommandHelper, $nsCloudEulaCommandHelper, $nsCloudBuildService, $nsCloudBuildCommandHelper, $errors, $nsCloudOptionsProvider, $projectData, $nsCloudAndroidBundleValidatorHelper);
	}
}

$injector.registerCommand(["run|cloud|android", "cloud|run|android"], CloudRunAndroidCommand);
