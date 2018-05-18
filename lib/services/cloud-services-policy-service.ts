import { join } from "path";
import { EOL } from "os";

import { Policies } from "../constants";

export class CloudServicesPolicyService implements ICloudServicesPolicyService {
	private static readonly POLICIES: string = "policies";
	private static readonly CLOUD_SERVICES_POLICY_FILE_NAME: string = `${Policies.CLOUD_SERVICES_POLICY_NAME}.txt`;
	private static readonly GDPR_DATA_SUBJECT_ACCESS_REQUEST_URL: string = "https://app.onetrust.com/app/#/webform/65e969b1-9755-4cb6-adbb-0ae5939fb132";
	private static readonly PRIVACY_POLICY_URL: string = "https://www.progress.com/legal/privacy-policy";

	constructor(private $fs: IFileSystem,
		private $nsCloudPolicyService: IPolicyService) { }

	public async getCloudServicesPolicyMessage(): Promise<string> {
		return this.$fs.readText(this.getPathToPrivacyPolicy());
	}

	public async acceptCloudServicesPolicy(): Promise<void> {
		return this.$nsCloudPolicyService.accept({ policyName: Policies.CLOUD_SERVICES_POLICY_NAME, pathToPolicyFile: this.getPathToPrivacyPolicy() });
	}

	public async shouldAcceptCloudServicesPolicy(): Promise<boolean> {
		return this.$nsCloudPolicyService.shouldAcceptPolicy({ policyName: Policies.CLOUD_SERVICES_POLICY_NAME, pathToPolicyFile: this.getPathToPrivacyPolicy() });
	}

	public getGdprDataSubjectAccessRequestUrl(): string {
		return CloudServicesPolicyService.GDPR_DATA_SUBJECT_ACCESS_REQUEST_URL;
	}

	public async getCloudServicesFullMessage(): Promise<string> {
		return [
			await this.getCloudServicesPolicyMessage(),
			"You can review the Progress Software Privacy Policy at " + this.getPrivacyPolicyUrl().yellow,
			"You can submit a GDPR Data Subject Access Request at " + this.getGdprDataSubjectAccessRequestUrl().yellow
		].join(EOL);
	}

	public getPrivacyPolicyUrl(): string {
		return CloudServicesPolicyService.PRIVACY_POLICY_URL;
	}

	private getPathToPrivacyPolicy(): string {
		return join(__dirname, "..", "..", "resources", CloudServicesPolicyService.POLICIES, CloudServicesPolicyService.CLOUD_SERVICES_POLICY_FILE_NAME);
	}
}

$injector.register("nsCloudServicesPolicyService", CloudServicesPolicyService);
