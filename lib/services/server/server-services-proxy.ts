import { CONTENT_TYPES, HTTP_HEADERS, BEARER_AUTH_SCHEME } from "../../constants";
import { URL } from "url";

export class ServerServicesProxy implements IServerServicesProxy {
	protected serverConfig: IServerConfig;

	constructor(private $nsCloudErrorsService: IErrors,
		private $httpClient: Server.IHttpClient,
		private $logger: ILogger,
		private $nsCloudConfigManager: ICloudConfigManager,
		private $nsCloudUserService: IUserService) {
		this.serverConfig = this.$nsCloudConfigManager.getCurrentConfigData();
	}

	public async call<T>(options: ICloudRequestOptions): Promise<T> {
		const host = this.getServiceDomainName(options.serviceName);
		const finalUrlPath = this.getUrlPath(options.serviceName, options.urlPath);

		const headers = options.headers || Object.create(null);
		const authScheme = this.getAuthScheme(options.serviceName);
		if (!_.has(headers, HTTP_HEADERS.AUTHORIZATION) && this.$nsCloudUserService.hasUser()) {
			headers[HTTP_HEADERS.AUTHORIZATION] = `${authScheme} ${this.$nsCloudUserService.getUserData().accessToken}`;
		}

		const namespace = this.$nsCloudConfigManager.getServiceValueOrDefault(options.serviceName, "namespace");
		if (namespace) {
			headers[HTTP_HEADERS.X_NS_NAMESPACE] = namespace;
			if (this.$nsCloudUserService.hasUser()) {
				const userData = this.$nsCloudUserService.getUserData();
				headers[HTTP_HEADERS.X_NS_INSTANCE_ID] = userData.instanceId || "";
			}
		}

		if (options.accept) {
			headers[HTTP_HEADERS.ACCEPT] = options.accept;
		}

		const reqProto = this.getServiceProto(options.serviceName);
		const reqUrl = new URL(finalUrlPath, `${reqProto}://${host}`);
		let requestOpts: any = {
			url: reqUrl.toString(),
			method: options.method,
			headers: headers,
			pipeTo: options.resultStream,
			timeout: options.timeout
		};

		if (options.bodyValues) {
			if (options.bodyValues.length > 1) {
				throw new Error("TODO: CustomFormData not implemented");
			}

			let theBody = options.bodyValues[0];
			requestOpts.body = theBody.value;
			requestOpts.headers[HTTP_HEADERS.CONTENT_TYPE] = theBody.contentType;
		}

		let response: Server.IResponse;
		try {
			response = await this.$httpClient.httpRequest(requestOpts);
		} catch (err) {
			if (err.response && err.response.statusCode === 402) {
				this.$nsCloudErrorsService.fail(JSON.parse(err.body).message);
			}

			throw err;
		}

		this.$logger.debug("%s (%s %s) returned %d", finalUrlPath, options.method, options.urlPath, response.response.statusCode);

		try {
			const resultValue: T = options.accept === CONTENT_TYPES.APPLICATION_JSON ? JSON.parse(response.body) : response.body;
			return resultValue;
		} catch (err) {
			this.$logger.trace("Error while trying to parse body: ", err);
			throw new Error(`Server returned unexpected response: ${response.body}`);
		}
	}

	public getServiceProto(serviceName: string): string {
		return this.$nsCloudConfigManager.getServiceValueOrDefault(serviceName, "serverProto");
	}

	public getUrlPath(serviceName: string, urlPath: string): string {
		const apiVersion = this.$nsCloudConfigManager.getServiceValueOrDefault(serviceName, "apiVersion");
		let result: string;
		// When we use localhost we don't have api version and we use the url path as is.
		if (!apiVersion) {
			result = urlPath;
		} else {
			// In case we use PR build or the official services we must prepend the api version to the url path.
			result = `${apiVersion}/${urlPath}`;
		}

		return result.startsWith("/") ? result : `/${result}`;
	}

	protected getAuthScheme(serviceName: string): string {
		return BEARER_AUTH_SCHEME;
	}

	protected getServiceDomainName(serviceName: string): string {
		return this.$nsCloudConfigManager.getServiceDomainName(serviceName);
	}
}

$injector.register("nsCloudServerServicesProxy", ServerServicesProxy);
