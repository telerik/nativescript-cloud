import { join } from "path";

export class PolicyService implements IPolicyService {
	public static readonly PRIVACY_POLICY_NAME: string = "privacy-policy";
	private static readonly POLICIES: string = "policies";
	private static readonly PRIVACY_POLICY_FILE_NAME: string = `${PolicyService.PRIVACY_POLICY_NAME}.txt`;

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
		return this.accept({ policyName: PolicyService.PRIVACY_POLICY_NAME, pathToPolicyFile: this.getPathToPrivacyPolicy() });
	}

	public async shouldAcceptPrivacyPolicy(): Promise<boolean> {
		return this.shouldAcceptPolicy({ policyName: PolicyService.PRIVACY_POLICY_NAME, pathToPolicyFile: this.getPathToPrivacyPolicy() });
	}

	private async getPolicyUserSetting(policy: string): Promise<string> {
		const policiesKey = await this.$userSettingsService.getSettingValue<IDictionary<string>>(PolicyService.POLICIES) || {};
		return policiesKey ? policiesKey[policy] : null;
	}

	private async setPolicyUserSetting(policy: string, value: string): Promise<void> {
		const policiesKey = await this.$userSettingsService.getSettingValue<IDictionary<string>>(PolicyService.POLICIES) || {};

		policiesKey[policy] = value;
		await this.$userSettingsService.saveSetting(PolicyService.POLICIES, policiesKey);
	}

	private getPathToPrivacyPolicy(): string {
		return join(__dirname, "..", "..", "resources", PolicyService.POLICIES, PolicyService.PRIVACY_POLICY_FILE_NAME);
	}
}

$injector.register("nsCloudPolicyService", PolicyService);