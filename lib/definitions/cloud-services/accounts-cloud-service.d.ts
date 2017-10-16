interface IGetUsageInfo {
	/**
	 * Returns the usage information for the provided account.
	 * @param {string} accountId Account id which will be used to get the usage info.
	 * @returns {Promise<IUsageInfo[]>}.
	 */
	getUsageInfo(accountId: string): Promise<IUsageInfo[]>;
}

interface IAccountsCloudService extends IGetUsageInfo {
	getAccounts(): Promise<IAccount[]>
	getUserInfo(): Promise<IUserInfo>;
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

interface IUsageInfoBase {
	/**
	 * The name of the feature (e.g. Cloud Builds).
	 */
	feature: string;

	/**
	 * The maximum allowed usage ammount.
	 */
	allowedUsage: number;

	/**
	 * If this property is set to true the allowed usage is unlimited.
	 */
	unlimited: boolean;
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
