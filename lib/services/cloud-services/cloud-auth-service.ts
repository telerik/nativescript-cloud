import { AUTH_SERVICE_NAME, CONTENT_TYPES } from "../../constants";

export class CloudAuthService implements ICloudAuthService {
	constructor(private $cloudServicesProxy: ICloudServicesProxy) { }

	public getLoginUrl(port: number): string {
		const proto = this.$cloudServicesProxy.getServiceProto(AUTH_SERVICE_NAME);
		const host = this.$cloudServicesProxy.getServiceAddress(AUTH_SERVICE_NAME);
		const urlPath = this.$cloudServicesProxy.getUrlPath(AUTH_SERVICE_NAME, "api/login");
		return `${proto}://${host}${urlPath}?port=${port}`;
	}

	public refreshToken(refreshToken: string): Promise<ITokenData> {
		return this.sendPostRequest<ITokenData>("api/refresh-token", { refreshToken });
	}

	public devLogin(username: string, password: string): Promise<IUserData> {
		return this.sendPostRequest<IUserData>("api/credentials-grant", { username, password });
	}

	public getTokenState(token: string): Promise<ITokenState> {
		return this.sendPostRequest<ITokenState>("api/token-state", { token });
	}

	private createJsonBody(body: any): IRequestBodyElement[] {
		if (typeof (body) !== "string") {
			body = JSON.stringify(body);
		}

		return [{
			contentType: CONTENT_TYPES.APPLICATION_JSON,
			value: body,
			name: "body"
		}];
	}

	private sendPostRequest<T>(urlPath: string, body: any): Promise<T> {
		return this.$cloudServicesProxy.call<T>(AUTH_SERVICE_NAME,
			"POST",
			urlPath,
			this.createJsonBody(body),
			CONTENT_TYPES.APPLICATION_JSON,
			null,
			null);
	}
}

$injector.register("cloudAuthService", CloudAuthService);
