export class AccountsService implements IAccountsService {
	constructor(private $nsCloudAccountsCloudService: IAccountsCloudService,
		private $errors: IErrors) { }

	public getMyAccounts(): Promise<IAccount[]> {
		return this.$nsCloudAccountsCloudService.getAccounts();
	}

	public async getUsageInfo(accountIdOption: string): Promise<IUsageInfo[]> {
		const account = await this.getAccountFromOption(accountIdOption);
		return this.$nsCloudAccountsCloudService.getUsageInfo(account.id);
	}

	public async getAccountFromOption(accountIdOption: string): Promise<IAccount> {
		const accounts = await this.getMyAccounts();
		if (!accountIdOption) {
			this.$errors.failWithoutHelp("Please provide accountId.");
		} else {
			let selectedAccount = _.find(accounts, a => a.id === accountIdOption);
			if (selectedAccount) {
				return selectedAccount;
			} else {
				try {
					const accountIndex = Number.parseInt(accountIdOption);
					selectedAccount = accounts[accountIndex - 1];
					if (selectedAccount) {
						return selectedAccount;
					} else {
						this.$errors.failWithoutHelp("Invalid accountId index provided.");
					}
				} catch (err) {
					this.$errors.failWithoutHelp("Invalid accountId option provided.");
				}
			}
		}
	}
}

$injector.register("nsCloudAccountsService", AccountsService);
