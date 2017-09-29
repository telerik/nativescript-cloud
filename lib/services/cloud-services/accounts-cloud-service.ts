import { ACCOUNTS_SERVICE_NAME, HTTP_METHODS } from "../../constants";
import { CloudServiceBase } from "./cloud-service-base";

export class AccountsCloudService extends CloudServiceBase implements IAccountsCloudService {
	protected serviceName: string = ACCOUNTS_SERVICE_NAME;

	constructor(protected $cloudServicesProxy: ICloudServicesProxy) {
		super($cloudServicesProxy);
	}

	public getAccounts(): Promise<IAccount[]> {
		return this.sendRequest<IAccount[]>(HTTP_METHODS.GET, "api/accounts", null);
	}

	public getUsageInfo(accountId: string): Promise<IUsageInfo[]> {
		return this.sendRequest<IUsageInfo[]>(HTTP_METHODS.GET, `api/usage?accountId=${accountId}`, null);
	}

	public getUserInfo(): Promise<IUserInfo> {
		return this.sendRequest<IUserInfo>(HTTP_METHODS.GET, "api/user-info", null);
	}
}

$injector.register("accountsCloudService", AccountsCloudService);
