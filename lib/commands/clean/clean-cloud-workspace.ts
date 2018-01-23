export class CleanCloudWorkspace implements ICommand {
	public allowedParameters: ICommandParameter[];

	constructor(private $nsCloudEulaCommandHelper: IEulaCommandHelper,
		private $nsCloudProjectService: ICloudProjectService,
		private $projectData: IProjectData) {
		this.$projectData.initializeProjectData();
	}

	public async execute(args: string[]): Promise<void> {
		await this.$nsCloudProjectService.cleanupProject(this.$projectData.projectId, this.$projectData.projectName);
	}

	public async canExecute(args: string[]): Promise<boolean> {
		await this.$nsCloudEulaCommandHelper.ensureEulaIsAccepted();

		return true;
	}
}

$injector.registerCommand(["clean|cloud|workspace"], CleanCloudWorkspace);
