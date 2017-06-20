import { AUTH_SERVICE_NAME, HTTP_METHODS } from "../../constants";
import { CloudServiceBase } from "./cloud-service-base";

export class AuthCloudService extends CloudServiceBase implements IAuthCloudService {
	protected serviceName: string = AUTH_SERVICE_NAME;

	constructor(protected $cloudServicesProxy: ICloudServicesProxy) {
		super($cloudServicesProxy);
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

	public getUserInfo(): Promise<IUserInfo> {
		return this.sendRequest<IUserInfo>(HTTP_METHODS.GET, "api/user-info", null);
	}

	private getAuthUrl(urlPath: string): string {
		const proto = this.$cloudServicesProxy.getServiceProto(AUTH_SERVICE_NAME);
		const host = this.$cloudServicesProxy.getServiceAddress(AUTH_SERVICE_NAME);
		const url = this.$cloudServicesProxy.getUrlPath(AUTH_SERVICE_NAME, urlPath);
		return `${proto}://${host}${url}`;
	}
}

$injector.register("authCloudService", AuthCloudService);
