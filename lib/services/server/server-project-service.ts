import { PROJECT_SERVICE_NAME, HTTP_METHODS } from "../../constants";
import { ServerServiceBase } from "./server-service-base";

export class ServerProjectService extends ServerServiceBase implements IServerProjectService {
	protected serviceName: string = PROJECT_SERVICE_NAME;

	constructor(protected $nsCloudServerRequestService: IServerServicesProxy,
		$injector: IInjector) {
		super($nsCloudServerRequestService, $injector);
	}

	public cleanupProjectData(projectData: ICleanupProjectData): Promise<ICleanupProjectResponse> {
		(<INSCloudGlobal>global).showErrorForStoppedCloudBuilds();

		return this.sendRequest<ICleanupProjectResponse>(HTTP_METHODS.POST, "api/cleanup-data", projectData);
	}
}

$injector.register("nsCloudServerProjectService", ServerProjectService);
