interface IGetUsageInfo {
	/**
	 * Returns the usage information for the provided account.
	 * @param {string} accountId Account id which will be used to get the usage info.
	 * @returns {Promise<IUsageInfo[]>}.
	 */
	getUsageInfo(accountId: string): Promise<IUsageInfo[]>;
}

interface IServerAccountsService extends IGetUsageInfo {
	getAccounts(): Promise<IAccount[]>
	getUserInfo(): Promise<IUserInfo>;
	getAccountFeatures(accountId: string): Promise<IFeatureInfo[]>;
}

interface IAccount {
	/**
	 * The identifier of the account.
	 */
	id: string;

	/**
	 * The name of the account. Currently firstname and lastname of the owner.
	 */
	name: string;

	/**
	 * The type of the account - personal or shared.
	 */
	type: string;
}

interface IFeatureInfoBase {
	/**
	 * The name of the feature (e.g. Cloud Builds).
	 */
	feature: string;
}

interface IUsageInfoBase extends IFeatureInfoBase {
	/**
	 * The maximum allowed usage ammount.
	 */
	allowedUsage: number;

	/**
	 * If this property is set to true the allowed usage is unlimited.
	 */
	unlimited: boolean;

	/**
	 * When the monthly usage will be reset. This property is here for backwards compatibility.
	 */
	licenseExpiration: string;

	/**
	 * When the license of the user expires. This is not necessary to be one month. We have complimentary
	 * licenses with custom license expiration. Also our users can buy N monthly licenses and the
	 * license expiration date will be N * 1 month.
	 */
	licenseExpirationDate: string;

	/**
	 * When the monthly usage will be reset.
	 */
	resetDate: string;

	/**
	 * The type of the license.
	 */
	licenseType: string;

	/**
	 * Subscription edition type.
	 */
	editionType: string;
}

interface IUsageInfo extends IUsageInfoBase {
	/**
	 * The description of the feature.
	 */
	description: string;

	/**
	 * The usage amount.
	 */
	usage: number;

	/**
	 * The usage ammount after which a notification should be sent to the user.
	 */
	softUsageLimit: number;
}

interface IFeatureInfo extends IFeatureInfoBase {
	/**
	 * The type of the feature (e.g. CloudBuilds).
	 */
	type: string;
	/**
	 * If this property is set to true the feature is enabled for the account.
	 */
	enabled: boolean;
}
