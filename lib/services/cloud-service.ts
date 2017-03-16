import * as querystring from "querystring";

export class AppsBuildService implements CloudService.IAppsBuildServiceContract {
	constructor(private $serviceProxy: CloudService.IServiceProxy) {
	}

	public buildProject(appId: string, buildRequest: CloudService.BuildRequestData): Promise<CloudService.Object> {
		return this.$serviceProxy.call<CloudService.Object>('BuildProject', 'POST', ['api', 'apps', encodeURI(appId.replace(/\\/g, '/')), 'build'].join('/'), 'application/json', [{ name: 'buildRequest', value: JSON.stringify(buildRequest), contentType: 'application/json' }], null);
	}

	public getPresignedUploadUrlObject(appId: string, fileName: string): Promise<CloudService.AmazonStorageEntry> {
		return this.$serviceProxy.call<CloudService.AmazonStorageEntry>('GetPresignedUploadUrlObject', 'GET', ['api', 'apps', encodeURI(appId.replace(/\\/g, '/')), 'build', 'uploadurl'].join('/') + '?' + querystring.stringify({ 'fileName': fileName }), 'application/json', null, null);
	}
}

export class ServiceContainer implements CloudService.IServer {
	constructor(private $injector: IInjector) { }

	public appsBuild: CloudService.IAppsBuildServiceContract = this.$injector.resolve(AppsBuildService);
}

$injector.register("server", ServiceContainer);
