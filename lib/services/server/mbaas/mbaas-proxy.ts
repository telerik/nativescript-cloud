import { ServerServicesProxy } from "../server-services-proxy";

export class MBaasProxy extends ServerServicesProxy implements IServerServicesProxy {
	constructor($errors: IErrors,
		$httpClient: Server.IHttpClient,
		$logger: ILogger,
		$nsCloudServerConfigManager: IServerConfigManager,
		$nsCloudUserService: IUserService) {
		super($errors, $httpClient, $logger, $nsCloudServerConfigManager, $nsCloudUserService);
	}

	public getServiceAddress(serviceName: string): string {
		const serviceConfig = this.serverConfig.mBaaS[serviceName];
		return serviceConfig.fullHostName;
	}

	public getUrlPath(serviceName: string, urlPath: string): string {
		const apiVersion = this.serverConfig.mBaaS[serviceName].apiVersion;
		let result = `${apiVersion}/${urlPath}`;
		return result.startsWith("/") ? result : `/${result}`;
	}

	protected getAuthScheme(serviceName: string): string {
		return this.serverConfig.mBaaS[serviceName].authScheme || super.getAuthScheme(serviceName);
	}
}

$injector.register("nsCloudMBaasProxy", MBaasProxy);
