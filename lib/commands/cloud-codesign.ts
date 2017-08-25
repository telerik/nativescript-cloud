import { isInteractive } from "../helpers";

export class CloudCodesignCommand implements ICommand {
	private parametersValidationText = "The command has only 3 valid parameters - Apple account id, Apple account password and optional parameter clean for force re-invokation of certificate, if any.";
	public allowedParameters: ICommandParameter[];

	constructor(private $logger: ILogger,
		private $errors: IErrors,
		private $projectData: IProjectData,
		private $prompter: IPrompter,
		private $options: IOptions,
		private $cloudCodesignService: ICloudCodesignService) {
		this.$projectData.initializeProjectData();
	}

	public async execute(args: string[]): Promise<void> {
		let username = args[0];
		let password = args[1];

		if (!username) {
			if (isInteractive) {
				username = await this.$prompter.getString("Apple ID", { allowEmpty: false });
			} else {
				this.$errors.fail(this.parametersValidationText);
			}
		}

		if (!password) {
			if (isInteractive) {
				password = await this.$prompter.getPassword("Apple ID password");
			} else {
				this.$errors.fail(this.parametersValidationText);
			}
		}

		this.$logger.info("Generating codesign files in the cloud");
		const codesignData = { username, password, clean: this.$options.clean };
		await this.$cloudCodesignService.generateCodesignFiles(codesignData, this.$projectData.projectDir);
	}

	public async canExecute(args: string[]): Promise<boolean> {
		if (args.length > 3) {
			this.$errors.fail(this.parametersValidationText);
		}

		return true;
	}
}

$injector.registerCommand("codesign|cloud", CloudCodesignCommand);
