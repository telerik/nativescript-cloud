import * as querystring from "querystring";
import { CODE_COMMIT_SERVICE_NAME, HTTP_METHODS } from "../../constants";
import { CloudServiceBase } from "./cloud-service-base";

export class CodeCommitService extends CloudServiceBase implements ICodeCommitService {
	protected serviceName: string = CODE_COMMIT_SERVICE_NAME;

	constructor(protected $cloudRequestService: ICloudRequestService) {
		super($cloudRequestService);
	}

	public getRepository(appId: string): Promise<IGetRepositoryResponse> {
		return this.sendRequest<IGetRepositoryResponse>(HTTP_METHODS.GET, `api/repositories?${querystring.stringify({ appId })}`, null);
	}

	public deleteRepository(appId: string): Promise<IDeleteRepositoryResponse> {
		return this.sendRequest<IDeleteRepositoryResponse>(HTTP_METHODS.DELETE, `api/repositories?${querystring.stringify({ appId })}`, null);
	}
}

$injector.register("codeCommitService", CodeCommitService);
