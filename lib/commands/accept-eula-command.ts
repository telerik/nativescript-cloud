export class AcceptEulaCommand implements ICommand {
	public allowedParameters: ICommandParameter[];

	constructor(private $nsCloudEulaCommandHelper: IEulaCommandHelper,
		private $errors: IErrors) {

	}
	public async canExecute(args: string[]): Promise<boolean> {
		if (args.length) {
			this.$errors.failWithoutHelp("This command does not accept arguments.");
		}

		return true;
	}

	public execute(args: string[]): Promise<void> {
		return this.$nsCloudEulaCommandHelper.acceptEula();
	}
}

$injector.registerCommand("accept|eula", AcceptEulaCommand);
