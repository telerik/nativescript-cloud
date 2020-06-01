import * as querystring from "querystring";
import { BUILD_SERVICE_NAME, HTTP_METHODS } from "../../constants";
import { ServerServiceBase } from "./server-service-base";

export class ServerBuildService extends ServerServiceBase implements IServerBuildService {
	protected serviceName: string = BUILD_SERVICE_NAME;

	constructor(protected $nsCloudServerRequestService: IServerRequestService,
		$injector: IInjector) {
		super($nsCloudServerRequestService, $injector);
	}

	public startBuild(buildRequest: IBuildRequestData): Promise<IServerResponse> {
		(<INSCloudGlobal>global).showErrorForStoppedCloudBuilds();

		return this.sendRequest<IServerResponse>(HTTP_METHODS.POST, "api/build", buildRequest);
	}

	public getPresignedUploadUrlObject(fileName: string): Promise<IAmazonStorageEntry> {
		(<INSCloudGlobal>global).showErrorForStoppedCloudBuilds();

		return this.sendRequest<IAmazonStorageEntry>(HTTP_METHODS.GET, `api/upload-url?${querystring.stringify({ fileName })}`, null);
	}

	public getBuildCredentials(buildCredentialRequest: IBuildCredentialRequest): Promise<IBuildCredentialResponse> {
		(<INSCloudGlobal>global).showErrorForStoppedCloudBuilds();

		return this.sendRequest<IBuildCredentialResponse>(HTTP_METHODS.POST, "api/build-credentials", buildCredentialRequest);
	}

	public generateCodesignFiles(codesignRequestData: ICodeSignRequestData): Promise<IServerResponse> {
		(<INSCloudGlobal>global).showErrorForStoppedCloudBuilds();

		return this.sendRequest<IServerResponse>(HTTP_METHODS.POST, "api/codesign", codesignRequestData);
	}

	public publish(publishRequestData: IPublishRequestData): Promise<IServerResponse> {
		(<INSCloudGlobal>global).showErrorForStoppedCloudBuilds();

		return this.sendRequest<IServerResponse>(HTTP_METHODS.POST, "api/publish", publishRequestData);
	}

	public appleLogin(appleLoginRequestData: IAppleLoginRequestData): Promise<IServerResponse> {
		(<INSCloudGlobal>global).showErrorForStoppedCloudBuilds();

		return this.sendRequest<IServerResponse>(HTTP_METHODS.POST, "api/apple-login", appleLoginRequestData);
	}
}

$injector.register("nsCloudServerBuildService", ServerBuildService);
