import * as querystring from "querystring";
import { BUILD_SERVICE_NAME, HTTP_METHODS } from "../../constants";
import { CloudServiceBase } from "./cloud-service-base";

export class BuildCloudService extends CloudServiceBase implements IBuildCloudService {
	protected serviceName: string = BUILD_SERVICE_NAME;

	constructor(protected $cloudRequestService: ICloudRequestService) {
		super($cloudRequestService);
	}

	public startBuild(appId: string, buildRequest: IBuildRequestData): Promise<IServerResponse> {
		return this.sendRequest<IServerResponse>(HTTP_METHODS.POST, "api/build", buildRequest);
	}

	public getPresignedUploadUrlObject(appId: string, fileName: string): Promise<IAmazonStorageEntry> {
		return this.sendRequest<IAmazonStorageEntry>(HTTP_METHODS.GET, `api/upload-url?${querystring.stringify({ fileName })}`, null);
	}

	public getBuildCredentials(buildCredentialRequest: IBuildCredentialRequest): Promise<IBuildCredentialResponse> {
		return this.sendRequest<IBuildCredentialResponse>(HTTP_METHODS.POST, "api/build-credentials", buildCredentialRequest);
	}

	public generateCodesignFiles(codesignRequestData: IServerRequestData): Promise<IServerResponse> {
		return this.sendRequest<IServerResponse>(HTTP_METHODS.POST, "api/codesign", codesignRequestData);
	}
}

$injector.register("buildCloudService", BuildCloudService);
