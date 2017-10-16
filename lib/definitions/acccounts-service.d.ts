/**
 * Describes service which works with accounts.
 */
interface IAccountsService extends IGetUsageInfo {
	/**
	 * Returns all accounts which can be used from the current user.
	 * Each user can have personal account and shared accounts.
	 * @returns {Promise<IAccount[]>}
	 */
	getMyAccounts(): Promise<IAccount[]>

	/**
	 * Parses the provided option and uses it to find account.
	 * The option can be the account id or the number of the account returned from the account list command.
	 * @param {string} accountIdOption Account id which will be parsed and used to find account.
	 * @returns {Promise<IAccount>}
	 */
	getAccountFromOption(accountIdOption: string): Promise<IAccount>;
}

interface IFeatureUsage extends IUsageInfoBase {
	remaining: number;
	performed: number;
}
