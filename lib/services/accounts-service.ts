export class AccountsService implements IAccountsService {
	constructor(private $nsCloudServerAccountsService: IServerAccountsService,
		private $errors: IErrors) { }

	public getMyAccounts(): Promise<IAccount[]> {
		return this.$nsCloudServerAccountsService.getAccounts();
	}

	public async getUsageInfo(accountIdOption: string): Promise<IUsageInfo[]> {
		const account = await this.getAccountFromOption(accountIdOption);
		return this.$nsCloudServerAccountsService.getUsageInfo(account.id);
	}

	public async getAccountFromOption(accountIdOption: string): Promise<IAccount> {
		const accounts = await this.getMyAccounts();
		if (!accountIdOption) {
			this.$errors.failWithoutHelp("Please provide accountId.");
		}

		let selectedAccount = _.find(accounts, a => a.id === accountIdOption);
		if (selectedAccount) {
			return selectedAccount;
		} else {
			const accountIndex = Number.parseInt(accountIdOption);
			selectedAccount = accounts[accountIndex - 1];
			if (!selectedAccount) {
				this.$errors.failWithoutHelp("Invalid accountId index provided.");
			}

			return selectedAccount;
		}
	}

	public async getAccountFeatures(accountIdOption: string): Promise<IFeatureInfo[]> {
		const account = await this.getAccountFromOption(accountIdOption);
		return this.$nsCloudServerAccountsService.getAccountFeatures(account.id);
	}
}

$injector.register("nsCloudAccountsService", AccountsService);
