import { AUTH_SERVICE_NAME, HTTP_METHODS } from "../../constants";
import { CloudServiceBase } from "./cloud-service-base";

export class AuthCloudService extends CloudServiceBase implements IAuthCloudService {
	protected serviceName: string = AUTH_SERVICE_NAME;

	constructor(protected $cloudServicesProxy: ICloudServicesProxy) {
		super($cloudServicesProxy);
	}

	public getLoginUrl(port: number): string {
		const proto = this.$cloudServicesProxy.getServiceProto(AUTH_SERVICE_NAME);
		const host = this.$cloudServicesProxy.getServiceAddress(AUTH_SERVICE_NAME);
		const urlPath = this.$cloudServicesProxy.getUrlPath(AUTH_SERVICE_NAME, "api/login");
		return `${proto}://${host}${urlPath}?port=${port}`;
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
}

$injector.register("authCloudService", AuthCloudService);
