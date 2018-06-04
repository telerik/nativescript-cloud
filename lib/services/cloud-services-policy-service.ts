import { join } from "path";
import { EOL } from "os";

import { Policies } from "../constants";

export class CloudServicesPolicyService implements ICloudServicesPolicyService {
	private static readonly POLICIES: string = "policies";
	private static readonly CLOUD_SERVICES_POLICY_FILE_NAME: string = `${Policies.CLOUD_SERVICES_POLICY_NAME}.txt`;
	private static readonly REASONS_FOR_COLLECTING_PERSONAL_DATA_FILE_NAME: string = "personal-data-collection-reasons.txt";
	private static readonly PERSONAL_DATA_SUBJECT_ACCESS_REQUEST_URL: string = "https://app.onetrust.com/app/#/webform/65e969b1-9755-4cb6-adbb-0ae5939fb132";
	private static readonly PRIVACY_POLICY_URL: string = "https://www.progress.com/legal/privacy-policy";

	constructor(private $fs: IFileSystem,
		private $nsCloudPolicyService: IPolicyService,
		private $nsCloudHashService: IHashService) { }

	public async acceptCloudServicesPolicy(): Promise<void> {
		return this.$nsCloudPolicyService.accept({ policyName: Policies.CLOUD_SERVICES_POLICY_NAME, content: await this.getCloudServicesFullMessageHash() });
	}

	public async shouldAcceptCloudServicesPolicy(): Promise<boolean> {
		return this.$nsCloudPolicyService.shouldAcceptPolicy({ policyName: Policies.CLOUD_SERVICES_POLICY_NAME, content: await this.getCloudServicesFullMessageHash() });
	}

	public async getCloudServicesFullMessage(): Promise<string> {
		const policyData = await this.getCloudServicesPolicyData();
		const message = _.map(policyData.reasonsForCollectingPersonalData, r => `• ${r}`);

		message.unshift(policyData.collectedPersonalDataMessage + ":");

		message.push("You can review the Progress Software Privacy Policy at " + policyData.privacyPolicyUrl.yellow);
		message.push("You can submit a GDPR Data Subject Access Request at " + policyData.personalDataSubjectAccessRequestUrl.yellow);
		return message.join(EOL);
	}

	public async getCloudServicesPolicyData(): Promise<ICloudServicesPolicyData> {
		return {
			collectedPersonalDataMessage: await this.getLocalPolicyContent(CloudServicesPolicyService.CLOUD_SERVICES_POLICY_FILE_NAME),
			reasonsForCollectingPersonalData: await this.getPersonalDataCollectionReasons(),
			personalDataSubjectAccessRequestUrl: CloudServicesPolicyService.PERSONAL_DATA_SUBJECT_ACCESS_REQUEST_URL,
			privacyPolicyUrl: CloudServicesPolicyService.PRIVACY_POLICY_URL
		};
	}

	private async getCloudServicesFullMessageHash(): Promise<string> {
		return this.$nsCloudHashService.getHash(await this.getCloudServicesFullMessage());
	}

	private async getPersonalDataCollectionReasons(): Promise<string[]> {
		const text = await this.getLocalPolicyContent(CloudServicesPolicyService.REASONS_FOR_COLLECTING_PERSONAL_DATA_FILE_NAME);

		return text.split(EOL).filter(r => !!r);
	}

	private async getLocalPolicyContent(policy: string): Promise<string> {
		const policyPath = join(__dirname, "..", "..", "resources", CloudServicesPolicyService.POLICIES, policy);

		return await this.$fs.readText(policyPath);
	}
}

$injector.register("nsCloudServicesPolicyService", CloudServicesPolicyService);
