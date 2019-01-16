import { AUTH_SERVICE_NAME, HTTP_METHODS, HTTP_HEADERS } from "../../constants";
import { ServerServiceBase } from "./server-service-base";

export class ServerAuthService extends ServerServiceBase implements IServerAuthService {
	protected serviceName: string = AUTH_SERVICE_NAME;

	constructor(protected $nsCloudServerServicesProxy: IServerServicesProxy,
		private $nsAccountUtils: IAccountUtils,
		private $nsCloudUserService: IUserService,
		$injector: IInjector) {
		super($nsCloudServerServicesProxy, $injector);
	}

	public getLoginUrl(port: number): string {
		const loginUrl = this.getAuthUrl("api/login");
		return `${loginUrl}?port=${port}`;
	}

	public refreshToken(refreshToken: string): Promise<ITokenData> {
		return this.sendRequest<ITokenData>(HTTP_METHODS.POST, "api/refresh-token", { refreshToken });
	}

	public devLogin(username: string, password: string, instanceId?: string): Promise<IUserData> {
		const headers = Object.create(null);
		if (this.$nsAccountUtils.isKinveyUser()) {
			this.$nsCloudUserService.clearUserData();
			headers[HTTP_HEADERS.X_NS_INSTANCE_ID] = instanceId;
		}

		return this.sendRequest<IUserData>(HTTP_METHODS.POST, "api/credentials-grant", { username, password }, headers);
	}

	public getTokenState(token: string): Promise<ITokenState> {
		return this.sendRequest<ITokenState>(HTTP_METHODS.POST, "api/token-state", { token });
	}

	public getLogoutUrl(): string {
		return this.getAuthUrl("api/logout");
	}

	private getAuthUrl(urlPath: string): string {
		const proto = this.$nsCloudServerServicesProxy.getServiceProto(AUTH_SERVICE_NAME);
		const host = this.$nsCloudServerServicesProxy.getServiceAddress(AUTH_SERVICE_NAME);
		const url = this.$nsCloudServerServicesProxy.getUrlPath(AUTH_SERVICE_NAME, urlPath);
		return `${proto}://${host}${url}`;
	}
}

$injector.register("nsCloudServerAuthService", ServerAuthService);
