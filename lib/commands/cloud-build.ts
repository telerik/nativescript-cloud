import { InteractiveCloudCommand } from "./interactive-cloud-command";

export class CloudBuildCommand extends InteractiveCloudCommand implements ICommand {
	public allowedParameters: ICommandParameter[];

	public get dashedOptions() {
		return this.$nsCloudOptionsProvider.dashedOptions;
	}

	constructor($nsCloudProcessService: IProcessService,
		protected $nsCloudErrorsService: IErrors,
		protected $logger: ILogger,
		protected $prompter: IPrompter,
		private $nsCloudEulaCommandHelper: IEulaCommandHelper,
		private $nsCloudBuildCommandHelper: IBuildCommandHelper,
		private $nsCloudBuildService: ICloudBuildService,
		private $nsCloudOptionsProvider: ICloudOptionsProvider,
		private $options: ICloudOptions,
		private $projectData: IProjectData) {
		super($nsCloudBuildService, $nsCloudProcessService, $nsCloudErrorsService, $logger, $prompter);
		this.$projectData.initializeProjectData();
	}

	public async canExecute(args: string[]): Promise<boolean> {
		(<INSCloudGlobal>global).showErrorForStoppedCloudBuilds();
		await this.$nsCloudEulaCommandHelper.ensureEulaIsAccepted();

		if (!args || !args.length) {
			this.$nsCloudErrorsService.failWithHelp("Provide platform.");
		}

		if (args.length > 1) {
			this.$nsCloudErrorsService.failWithHelp("Only a single platform is supported.");
		}

		return true;
	}

	protected async executeCore(args: string[]): Promise<void> {
		const buildData = this.$nsCloudBuildCommandHelper.getCloudBuildData(args[0]);
		await this.$nsCloudBuildService.build(buildData.projectSettings,
			buildData.platform, buildData.buildConfiguration,
			this.$options.accountId,
			buildData.androidBuildData,
			buildData.iOSBuildData,
			{ shouldPrepare: true });
	}
}

$injector.registerCommand(["build|cloud", "cloud|build"], CloudBuildCommand);
