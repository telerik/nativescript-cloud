import { join } from "path";
import { Policy } from "../constants";

export class PolicyService implements IPolicyService {
	private static readonly POLICIES: string = "policies";
	private static readonly NS_CLOUD_POLICIES: string = "nsCloudPolicies";
	private static readonly PRIVACY_POLICY_FILE_NAME: string = `${Policy.PRIVACY_POLICY_ALIAS}.txt`;

	constructor(private $errors: IErrors,
		private $fs: IFileSystem,
		private $nsCloudHashService: IHashService,
		private $userSettingsService: IUserSettingsService) { }

	public async accept(data: IAcceptPolicyData): Promise<void> {
		const policyHash = await this.$nsCloudHashService.getLocalFileHash(data.pathToPolicyFile);
		if (!policyHash) {
			this.$errors.failWithoutHelp("Invalid policy.");
		}

		await this.setPolicyUserSetting(data.policyName, policyHash);
	}

	public async shouldAcceptPolicy(data: IAcceptPolicyData): Promise<boolean> {
		const currentHash = await this.getPolicyUserSetting(data.policyName);
		if (!currentHash) {
			return true;
		}

		const newHash = await this.$nsCloudHashService.getLocalFileHash(data.pathToPolicyFile);
		return currentHash !== newHash;
	}

	public async getPrivacyPolicyMessage(): Promise<string> {
		return this.$fs.readText(this.getPathToPrivacyPolicy());
	}

	public async acceptPrivacyPolicy(): Promise<void> {
		return this.accept({ policyName: Policy.PRIVACY_POLICY_ALIAS, pathToPolicyFile: this.getPathToPrivacyPolicy() });
	}

	public async shouldAcceptPrivacyPolicy(): Promise<boolean> {
		return this.shouldAcceptPolicy({ policyName: Policy.PRIVACY_POLICY_ALIAS, pathToPolicyFile: this.getPathToPrivacyPolicy() });
	}

	private async getPolicyUserSetting(policy: string): Promise<string> {
		const policiesKey = await this.getNsCloudPoliciesSetting();
		return policiesKey ? policiesKey[policy] : null;
	}

	private async setPolicyUserSetting(policy: string, value: string): Promise<void> {
		const policiesKey = await this.getNsCloudPoliciesSetting();

		policiesKey[policy] = value;
		await this.$userSettingsService.saveSetting(PolicyService.NS_CLOUD_POLICIES, policiesKey);
	}

	private getPathToPrivacyPolicy(): string {
		return join(__dirname, "..", "..", "resources", PolicyService.POLICIES, PolicyService.PRIVACY_POLICY_FILE_NAME);
	}

	private async getNsCloudPoliciesSetting(): Promise<IDictionary<string>> {
		const setting = await this.$userSettingsService.getSettingValue<IDictionary<string>>(PolicyService.NS_CLOUD_POLICIES) || {};
		return setting;
	}
}

$injector.register("nsCloudPolicyService", PolicyService);
