interface IAccountsService {
	getMyAccounts(): Promise<IAccount[]>
	getUsageInfo(accountId: string): Promise<IUsageInfo[]>;
	getAccountFromOption(accountIdOption: string): Promise<IAccount>;
}
