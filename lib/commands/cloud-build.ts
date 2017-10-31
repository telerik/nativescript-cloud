export class CloudBuild implements ICommand {
	public allowedParameters: ICommandParameter[];

	public get dashedOptions() {
		return this.$nsCloudOptionsProvider.dashedOptions;
	}

	constructor(private $nsCloudEulaCommandHelper: IEulaCommandHelper,
		private $errors: IErrors,
		private $nsCloudBuildCommandHelper: IBuildCommandHelper,
		private $nsCloudBuildService: ICloudBuildService,
		private $nsCloudOptionsProvider: ICloudOptionsProvider,
		private $options: ICloudOptions,
		private $projectData: IProjectData) {
		this.$projectData.initializeProjectData();
	}

	public async execute(args: string[]): Promise<void> {
		const buildData = this.$nsCloudBuildCommandHelper.getCloudBuildData(args[0]);
		await this.$nsCloudBuildService.build(buildData.projectSettings,
			buildData.platform, buildData.buildConfiguration,
			this.$options.accountId,
			buildData.androidBuildData,
			buildData.iOSBuildData);
	}

	public async canExecute(args: string[]): Promise<boolean> {
		await this.$nsCloudEulaCommandHelper.ensureEulaIsAccepted();

		if (!args || !args.length) {
			this.$errors.fail("Provide platform.");
		}

		if (args.length > 1) {
			this.$errors.fail("Only a single platform is supported.");
		}

		return true;
	}
}

$injector.registerCommand(["build|cloud", "cloud|build"], CloudBuild);
