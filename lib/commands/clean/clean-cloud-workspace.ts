import { isInteractive } from "../../helpers";

export class CleanCloudWorkspace implements ICommand {
	private static COMMAND_REQUIREMENTS_ERROR_MESSAGE: string =
		"The command should be executed inside project or the app id and project name parameters must be provided.";

	public allowedParameters: ICommandParameter[] = [];

	constructor(private $errors: IErrors,
		private $nsCloudEulaCommandHelper: IEulaCommandHelper,
		private $nsCloudProjectService: ICloudProjectService,
		private $projectData: IProjectData,
		private $prompter: IPrompter) { }

	public async execute(args: string[]): Promise<void> {
		let appId: string;
		let projectName: string;

		if (args.length === 0) {
			try {
				// We want to use the project data only when no parameters are provided.
				this.$projectData.initializeProjectData();
				appId = this.$projectData.projectId;
				projectName = this.$projectData.projectName;
			} catch (err) {
				// We are not in project and the app id and project name parameters are not provided.
				if (!isInteractive()) {
					this.$errors.failWithoutHelp(CleanCloudWorkspace.COMMAND_REQUIREMENTS_ERROR_MESSAGE);
				}

				appId = await this.$prompter.getString("App Id:", { allowEmpty: false });
				projectName = await this.promptForProjectName();
			}
		} else if (args.length === 1) {
			// Only app id is provided. We need to ask for project name if we can.
			if (!isInteractive()) {
				this.$errors.failWithoutHelp(CleanCloudWorkspace.COMMAND_REQUIREMENTS_ERROR_MESSAGE);
			}

			appId = args[0];
			projectName = await this.promptForProjectName();
		} else {
			// Both app id and project name are provided as parameters.
			appId = args[0];
			projectName = args[1];
		}

		await this.$nsCloudProjectService.cleanupProject(appId, projectName);
	}

	public async canExecute(args: string[]): Promise<boolean> {
		if (!args || args.length > 2) {
			return false;
		}

		await this.$nsCloudEulaCommandHelper.ensureEulaIsAccepted();
		return true;
	}

	private async promptForProjectName(): Promise<string> {
		return this.$prompter.getString("Project name:", { allowEmpty: false });
	}
}

$injector.registerCommand(["clean|cloud|workspace"], CleanCloudWorkspace);
