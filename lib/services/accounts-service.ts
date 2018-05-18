export class AccountsService implements IAccountsService {
	constructor(private $errors: IErrors,
		private $nsCloudPolicyService: IPolicyService,
		private $nsCloudServerAccountsService: IServerAccountsService) { }

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

	public async getAccountFeatures(accountIdOption: string): Promise<IDictionary<IFeatureInfo>> {
		const account = await this.getAccountFromOption(accountIdOption);
		return this.$nsCloudServerAccountsService.getAccountFeatures(account.id);
	}

	public async sendPoliciesToCloud(): Promise<void> {
		const data = await this.$nsCloudPolicyService.getNsCloudPoliciesSetting();
		return this.$nsCloudServerAccountsService.syncPolicies(data);
	}
}

$injector.register("nsCloudAccountsService", AccountsService);
