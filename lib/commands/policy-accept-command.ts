import { Policy } from "./../constants";

export class PolicyAcceptCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [
		this.$stringParameterBuilder.createMandatoryParameter("Policy name cannot be empty."),
		new (<any>this.$stringParameter).__proto__.constructor()
	];

	constructor(private $errors: IErrors,
		private $nsCloudPolicyService: IPolicyService,
		private $stringParameter: ICommandParameter,
		private $stringParameterBuilder: IStringParameterBuilder) { }

	public async execute(args: string[]): Promise<void> {
		const policyName = args[0];

		if (policyName === Policy.PRIVACY_POLICY_ALIAS) {
			await this.$nsCloudPolicyService.acceptPrivacyPolicy();
			return;
		}

		const pathToPolicyFile = args[1];
		if (!pathToPolicyFile || pathToPolicyFile.length === 0) {
			this.$errors.failWithoutHelp("Please provide policy path.");
		}

		await this.$nsCloudPolicyService.accept({ policyName, pathToPolicyFile });
	}
}

$injector.registerCommand("policy|accept", PolicyAcceptCommand);
