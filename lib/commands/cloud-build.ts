export class CloudBuild implements ICommand {
	public allowedParameters: ICommandParameter[];

	constructor(private $errors: IErrors,
		private $buildCommandHelper: IBuildCommandHelper,
		private $projectData: IProjectData,
		private $cloudBuildService: ICloudBuildService) {
		this.$projectData.initializeProjectData();
	}

	public async execute(args: string[]): Promise<void> {
		const buildData = this.$buildCommandHelper.getCloudBuildData(args[0]);
		await this.$cloudBuildService.build(buildData.projectSettings,
			buildData.platform, buildData.buildConfiguration,
			buildData.androidBuildData,
			buildData.iOSBuildData);
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

$injector.registerCommand(["build|cloud", "cloud|build"], CloudBuild);
