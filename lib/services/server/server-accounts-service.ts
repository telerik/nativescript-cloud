import { ACCOUNTS_SERVICE_NAME, HTTP_METHODS } from "../../constants";
import { ServerServiceBase } from "./server-service-base";

export class ServerAccountsService extends ServerServiceBase implements IServerAccountsService {
	protected serviceName: string = ACCOUNTS_SERVICE_NAME;

	constructor(protected $nsCloudServerRequestService: IServerServicesProxy,
		$injector: IInjector) {
		super($nsCloudServerRequestService, $injector);
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

$injector.register("nsCloudServerAccountsService", ServerAccountsService);
