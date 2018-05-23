/**
 * Describes methods for working with {N} Cloud Services policies.
 */
interface ICloudServicesPolicyService {
	/**
	 * Marks the cloud services policy as accepted.
	 */
	acceptCloudServicesPolicy(): Promise<void>;

	/**
	 * Returns if the cloud services policy should be accepted.
	 */
	shouldAcceptCloudServicesPolicy(): Promise<boolean>;

	/**
	 * Returns all data related to the Cloud services policy.
	 */
	getCloudServicesPolicyData(): Promise<ICloudServicesPolicyData>;

	/**
	 * Returns the full cloud services CLI prompt message.
	 */
	getCloudServicesFullMessage(): Promise<string>;
}

/**
 * Contains all data related to the Cloud services policy.
 */
interface ICloudServicesPolicyData {
	/**
	 * The message which describes what personal data is collected.
	 */
	collectedPersonalDataMessage: string;

	/**
	 * The reasons to collect the personal data.
	 */
	reasonsForCollectingPersonalData: string[];

	/**
	 * The url for submitting personal data subject request.
	 */
	personalDataSubjectAccessRequestUrl: string;

	/**
	 * The url for the Progress Software Privacy Policy.
	 */
	privacyPolicyUrl: string;
}
