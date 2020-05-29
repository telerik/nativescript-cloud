export class AccountsService implements IAccountsService {
	constructor(private $nsCloudErrorsService: IErrors,
		private $nsCloudPolicyService: IPolicyService,
		private $nsCloudServerAccountsService: IServerAccountsService) { }

	public async getMyAccounts(): Promise<IAccount[]> {
		(<INSCloudGlobal>global).showErrorForStoppedCloudBuilds();

		return this.$nsCloudServerAccountsService.getAccounts();
	}

	public async getUsageInfo(accountIdOption: string): Promise<IUsageInfo[]> {
		(<INSCloudGlobal>global).showErrorForStoppedCloudBuilds();

		const account = await this.getAccountFromOption(accountIdOption);
		return this.$nsCloudServerAccountsService.getUsageInfo(account.id);
	}

	public async getAccountFromOption(accountIdOption: string): Promise<IAccount> {
		(<INSCloudGlobal>global).showErrorForStoppedCloudBuilds();

		const accounts = await this.getMyAccounts();
		if (!accountIdOption) {
			this.$nsCloudErrorsService.fail("Please provide accountId.");
		}

		let selectedAccount = _.find(accounts, a => a.id === accountIdOption);
		if (selectedAccount) {
			return selectedAccount;
		} else {
			const accountIndex = Number.parseInt(accountIdOption);
			selectedAccount = accounts[accountIndex - 1];
			if (!selectedAccount) {
				this.$nsCloudErrorsService.fail("Invalid accountId index provided.");
			}

			return selectedAccount;
		}
	}

	public async getAccountFeatures(accountIdOption: string): Promise<IDictionary<IFeatureInfo>> {
		(<INSCloudGlobal>global).showErrorForStoppedCloudBuilds();

		const account = await this.getAccountFromOption(accountIdOption);
		return this.$nsCloudServerAccountsService.getAccountFeatures(account.id);
	}

	public async sendPoliciesToCloud(): Promise<void> {
		const data = await this.$nsCloudPolicyService.getNsCloudPoliciesSetting();
		return this.$nsCloudServerAccountsService.syncPolicies(data);
	}
}

$injector.register("nsCloudAccountsService", AccountsService);
