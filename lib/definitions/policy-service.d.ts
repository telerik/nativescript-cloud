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
	 * Returns if the client should ask the user to accept the provided policy.
	 * @param policy the name of the policy.
	 */
	shouldAskToAcceptPolicy(policy: string): Promise<boolean>;

	/**
	 * Marks the policy as accepted for the current OS user.
	 * @param data Data required to set a policy as accepted.
	 */
	accept(data: IAcceptPolicyData): Promise<void>;

	/**
	 * Returns the value stored on the local machine for the provided policy.
	 * @param policy is the policy name.
	 */
	getPolicyUserSetting(policy: string): Promise<string>;

	/**
	 * Returns the local user policies information.
	 */
	getNsCloudPoliciesSetting(): Promise<IDictionary<string>>;
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
	 * Url or local path to the policy content.
	 */
	policyUri?: string;

	/**
	 * The content of the policy whuch will be stored in the cloud.
	 */
	content?: string;
}
