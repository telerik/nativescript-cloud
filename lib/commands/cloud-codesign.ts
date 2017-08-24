export class CloudCodesign implements ICommand {
	public allowedParameters: ICommandParameter[];

	constructor(private $logger: ILogger,
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
			username = await this.$prompter.getString("Apple ID", { allowEmpty: false });
		}

		if (!password) {
			password = await this.$prompter.getPassword("Apple ID password");
		}

		this.$logger.info("Executing cloud codesign command");
		const codesignData = { username, password, clean: this.$options.clean };
		await this.$cloudCodesignService.generateCodesignFiles(codesignData, this.$projectData);
	}

	public async canExecute(args: string[]): Promise<boolean> {
		return true;
	}
}

$injector.registerCommand("codesign|cloud", CloudCodesign);
