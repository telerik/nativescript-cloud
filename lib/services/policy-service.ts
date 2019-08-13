import * as temp from "temp";
import { isUrl } from "../helpers";

export class PolicyService implements IPolicyService {
	private static readonly NS_CLOUD_POLICIES: string = "nsCloudPolicies";

	constructor(private $nsCloudErrorsService: IErrors,
		private $fs: IFileSystem,
		private $httpClient: Server.IHttpClient,
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
		const policyCloudContent = await this.getPolicyContentFromAcceptData(data);
		if (!policyCloudContent) {
			this.$nsCloudErrorsService.fail("Invalid policy.");
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
		} else if (data.policyUri) {
			let fileHash = data.policyUri;
			if (isUrl(data.policyUri)) {
				const tempPolicyFile = temp.path({ prefix: data.policyName, suffix: ".txt" });
				temp.track();
				await this.$httpClient.httpRequest({
					url: data.policyUri,
					pipeTo: this.$fs.createWriteStream(tempPolicyFile)
				});

				fileHash = tempPolicyFile;
			}

			return await this.$nsCloudHashService.getLocalFileHash(fileHash);
		}

		return null;
	}
}

$injector.register("nsCloudPolicyService", PolicyService);
