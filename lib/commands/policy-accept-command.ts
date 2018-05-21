import { Policies } from "./../constants";

export class PolicyAcceptCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [
		this.$stringParameterBuilder.createMandatoryParameter("Policy name cannot be empty."),
		this.$stringParameter
	];

	constructor(private $errors: IErrors,
		private $nsCloudPolicyService: IPolicyService,
		private $nsCloudServicesPolicyService: ICloudServicesPolicyService,
		private $stringParameter: ICommandParameter,
		private $stringParameterBuilder: IStringParameterBuilder) { }

	public async execute(args: string[]): Promise<void> {
		const policyName = args[0];

		if (policyName === Policies.CLOUD_SERVICES_POLICY_NAME) {
			await this.$nsCloudServicesPolicyService.acceptCloudServicesPolicy();
			return;
		}

		const policyUri = args[1];
		if (!policyUri || policyUri.length === 0) {
			this.$errors.failWithoutHelp("Please provide policy path.");
		}

		await this.$nsCloudPolicyService.accept({ policyName, policyUri });
	}
}

$injector.registerCommand("policy|accept", PolicyAcceptCommand);
