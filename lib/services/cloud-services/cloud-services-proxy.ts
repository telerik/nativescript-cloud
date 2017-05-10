import { CONTENT_TYPES } from "../../constants";

export class CloudServicesProxy implements ICloudServicesProxy {
	private serverConfig: IServerConfig;

	constructor(private $errors: IErrors,
		private $httpClient: Server.IHttpClient,
		private $logger: ILogger,
		private $packageInfoService: IPackageInfoService,
		private $serverConfigManager: IServerConfigManager) {
		this.serverConfig = this.$serverConfigManager.getCurrentConfigData();
	}

	public async call<T>(serviceName: string, method: string, urlPath: string, bodyValues: IRequestBodyElement[], accept: string, headers: any, resultStream: NodeJS.WritableStream): Promise<T> {
		const host = this.getServiceAddress(serviceName);
		const finalUrlPath = this.getUrlPath(serviceName, urlPath);

		headers = headers || Object.create(null);
		headers["User-Agent"] = `fusion/${this.$packageInfoService.getVersion()} (Node.js ${process.versions.node}; ${process.platform}; ${process.arch})`;

		if (accept) {
			headers.Accept = accept;
		}

		let requestOpts: any = {
			proto: this.getServiceProto(serviceName),
			host: host,
			path: finalUrlPath,
			method: method,
			headers: headers,
			pipeTo: resultStream
		};

		if (bodyValues) {
			if (bodyValues.length > 1) {
				throw new Error("TODO: CustomFormData not implemented");
			}

			let theBody = bodyValues[0];
			requestOpts.body = theBody.value;
			requestOpts.headers["Content-Type"] = theBody.contentType;
		}

		let response: Server.IResponse;
		try {
			response = await this.$httpClient.httpRequest(requestOpts);
		} catch (err) {
			if (err.response && err.response.statusCode === 402) {
				this.$errors.fail({ formatStr: "%s", suppressCommandHelp: true }, JSON.parse(err.body).Message);
			}

			throw err;
		}

		this.$logger.debug("%s (%s %s) returned %d", finalUrlPath, method, urlPath, response.response.statusCode);

		const resultValue: T = accept === CONTENT_TYPES.APPLICATION_JSON ? JSON.parse(response.body) : response.body;

		return resultValue;
	}

	public getServiceAddress(serviceName: string): string {
		const serviceConfig = this.serverConfig.cloudServices[serviceName];
		// When we want to use localhost or PR builds for cloud services
		// we need to return the specified full domain name.
		if (serviceConfig.fullHostName) {
			return serviceConfig.fullHostName;
		}

		// If we want to use the official domains we need the domain name and the subdomain for the service.
		return `${serviceConfig.subdomain}.${this.serverConfig.domainName}`;
	}

	public getServiceProto(serviceName: string): string {
		return this.getServiceValueOrDefault(serviceName, "serverProto");
	}

	public getUrlPath(serviceName: string, urlPath: string): string {
		const apiVersion = this.getServiceValueOrDefault(serviceName, "apiVersion");
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

	private getServiceValueOrDefault(serviceName: string, valueName: string): string {
		const serviceConfig = this.serverConfig.cloudServices[serviceName];
		if (_.has(serviceConfig, valueName)) {
			return serviceConfig[valueName];
		}

		return <string>this.serverConfig[valueName];
	}
}

$injector.register("cloudServicesProxy", CloudServicesProxy);
