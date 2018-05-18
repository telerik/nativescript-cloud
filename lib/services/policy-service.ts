export class PolicyService implements IPolicyService {
	private static readonly NS_CLOUD_POLICIES: string = "nsCloudPolicies";

	constructor(private $errors: IErrors,
		private $nsCloudHashService: IHashService,
		private $userSettingsService: IUserSettingsService) { }

	public async shouldAcceptPolicy(data: IAcceptPolicyData): Promise<boolean> {
		const shouldAskToAccept = await this.shouldAskToAcceptPolicy(data.policyName);
		if (shouldAskToAccept) {
			return true;
		}

		const currentContent = await this.getPolicyUserSetting(data.policyName);
		const acceptableContent = await this.getPolicyContentFromAcceptData(data);
		return currentContent !== acceptableContent;
	}

	public async shouldAskToAcceptPolicy(policy: string): Promise<boolean> {
		const currentContent = await this.getPolicyUserSetting(policy);
		return !currentContent;
	}

	public async accept(data: IAcceptPolicyData): Promise<void> {
		let policyCloudContent = await this.getPolicyContentFromAcceptData(data);
		if (!policyCloudContent) {
			this.$errors.failWithoutHelp("Invalid policy.");
		}

		await this.setPolicyUserSetting(data.policyName, policyCloudContent);
	}

	public async acceptInTheCloud(data: IAcceptPolicyData): Promise<void> {
		let policyCloudContent = await this.getPolicyContentFromAcceptData(data);
		if (!policyCloudContent) {
			this.$errors.failWithoutHelp("Invalid policy.");
		}

		await this.setPolicyUserSetting(data.policyName, policyCloudContent);
	}

	public async getPolicyUserSetting(policy: string): Promise<string> {
		const policiesKey = await this.getNsCloudPoliciesSetting();
		return policiesKey ? policiesKey[policy] : null;
	}

	public async getNsCloudPoliciesSetting(): Promise<IDictionary<string>> {
		const setting = await this.$userSettingsService.getSettingValue<IDictionary<string>>(PolicyService.NS_CLOUD_POLICIES) || {};
		return setting;
	}

	private async setPolicyUserSetting(policy: string, value: string): Promise<void> {
		const policiesKey = await this.getNsCloudPoliciesSetting();

		policiesKey[policy] = value;
		await this.$userSettingsService.saveSetting(PolicyService.NS_CLOUD_POLICIES, policiesKey);
	}

	private async getPolicyContentFromAcceptData(data: IAcceptPolicyData): Promise<string> {
		if (data.content) {
			return data.content;
		} else if (data.pathToPolicyFile) {
			return await this.$nsCloudHashService.getLocalFileHash(data.pathToPolicyFile);
		}

		return null;
	}
}

$injector.register("nsCloudPolicyService", PolicyService);
