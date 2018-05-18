/**
 * Describes methods for working with {N} Cloud Services policies.
 */
interface ICloudServicesPolicyService {
	/**
	 * Returns the cloud services policy message.
	 */
	getCloudServicesPolicyMessage(): Promise<string>;

	/**
	 * Marks the cloud services policy as accepted.
	 */
	acceptCloudServicesPolicy(): Promise<void>;

	/**
	 * Returns if the cloud services policy should be accepted.
	 */
	shouldAcceptCloudServicesPolicy(): Promise<boolean>;

	/**
	 * Returns the GDPR Data Subject Access Request url.
	 */
	getGdprDataSubjectAccessRequestUrl(): string;

	/**
	 * Returns the full cloud services CLI prompt message.
	 */
	getCloudServicesFullMessage(): Promise<string>;

	/**
	 * Returns the privacy policy url.
	 */
	getPrivacyPolicyUrl(): string;
}
