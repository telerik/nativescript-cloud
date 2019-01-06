import { isInteractive } from "../../helpers";
import { InteractiveCloudCommand } from "../interactive-cloud-command";

export class CleanCloudWorkspace extends InteractiveCloudCommand implements ICommand {
	private static COMMAND_REQUIREMENTS_ERROR_MESSAGE: string =
		"The command should be executed inside project or the app id and project name parameters must be provided.";

	public allowedParameters: ICommandParameter[] = [];

	constructor(protected $errors: IErrors,
		protected $logger: ILogger,
		protected $prompter: IPrompter,
		private $nsCloudEulaCommandHelper: IEulaCommandHelper,
		private $nsCloudProjectService: ICloudProjectService,
		private $projectData: IProjectData) {
		super($nsCloudProjectService, $errors, $logger, $prompter)
	}

	public async canExecute(args: string[]): Promise<boolean> {
		if (!args || args.length > 2) {
			return false;
		}

		await this.$nsCloudEulaCommandHelper.ensureEulaIsAccepted();
		return true;
	}

	protected async executeCore(args: string[]): Promise<void> {
		let appIdentifier: string | Mobile.IProjectIdentifier;
		let projectName: string;

		if (args.length === 0) {
			try {
				// We want to use the project data only when no parameters are provided.
				this.$projectData.initializeProjectData();
				appIdentifier = this.$projectData.projectIdentifiers || this.$projectData.projectId;
				projectName = this.$projectData.projectName;
			} catch (err) {
				// We are not in project and the app id and project name parameters are not provided.
				appIdentifier = await this.promptForAppId();
				projectName = await this.promptForProjectName();
			}
		} else if (args.length === 1) {
			// Only app id is provided. We need to ask for project name if we can.
			appIdentifier = await this.getParameterValue(args[0], () => this.promptForAppId());
			projectName = await this.promptForProjectName();
		} else {
			// Both app id and project name are provided as parameters.
			appIdentifier = await this.getParameterValue(args[0], () => this.promptForAppId());
			projectName = await this.getParameterValue(args[1], () => this.promptForProjectName());
		}

		await this.$nsCloudProjectService.cleanupProject({ appIdentifier, projectName });
	}

	private async promptForProjectName(): Promise<string> {
		if (!isInteractive()) {
			this.$errors.failWithoutHelp(CleanCloudWorkspace.COMMAND_REQUIREMENTS_ERROR_MESSAGE);
		}

		return this.$prompter.getString("Project name:", { allowEmpty: false });
	}

	private async promptForAppId(): Promise<string> {
		if (!isInteractive()) {
			this.$errors.failWithoutHelp(CleanCloudWorkspace.COMMAND_REQUIREMENTS_ERROR_MESSAGE);
		}

		return this.$prompter.getString("App Id:", { allowEmpty: false });
	}

	private async getParameterValue(param: string, action: () => Promise<string>): Promise<string> {
		if (param.trim().length > 0) {
			return param;
		}

		return action();
	}
}

$injector.registerCommand(["cloud|clean|workspace"], CleanCloudWorkspace);
