/**
 * Describes methods for working with policies.
 */
interface IPolicyService {
	/**
	 * Returns true if the provided policy should be accepted.
	 * @param data Data required to check if a policy should be accepted.
	 */
	shouldAcceptPolicy(data: IAcceptPolicyData): Promise<boolean>;

	/**
	 * Marks the policy as accepted for the current OS user.
	 * @param data Data required to set a policy as accepted.
	 */
	accept(data: IAcceptPolicyData): Promise<void>;

	/**
	 * Returns the Progress Software Privacy Policy message.
	 */
	getPrivacyPolicyMessage(): Promise<string>;

	/**
	 * Marks the Progress Software Privacy Policy as accepted.
	 */
	acceptPrivacyPolicy(): Promise<void>;

	/**
	 * Returns if the Progress Software Privacy Policy should be accepted.
	 */
	shouldAcceptPrivacyPolicy(): Promise<boolean>;
}

/**
 * Contains information about policy.
 */
interface IPolicyData {
	/**
	 * The content of the policy.
	 */
	content: string;

	/**
	 * Defines if the policy should be accepted.
	 */
	shouldAccept: boolean;
}

/**
 * Contains the required information for accepting a policy.
 */
interface IAcceptPolicyData {
	/**
	 * The name of the policy.
	 */
	policyName: string;

	/**
	 * Path to the policy file which will be used to calculate the policy hash.
	 */
	pathToPolicyFile: string;
}
