import { AUTH_SERVICE_NAME, HTTP_METHODS } from "../../constants";
import { ServerServiceBase } from "./server-service-base";

export class ServerAuthService extends ServerServiceBase implements IServerAuthService {
	protected serviceName: string = AUTH_SERVICE_NAME;

	constructor(protected $nsCloudServerServicesProxy: IServerServicesProxy,
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

	public devLogin(username: string, password: string): Promise<IUserData> {
		return this.sendRequest<IUserData>(HTTP_METHODS.POST, "api/credentials-grant", { username, password });
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
