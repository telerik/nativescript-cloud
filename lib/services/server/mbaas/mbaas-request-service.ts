import { ServerRequestService } from "../server-request-service";

export class MBaasRequestService extends ServerRequestService implements IServerRequestService {
	constructor($nsCloudAuthenticationService: IAuthenticationService,
		$logger: ILogger,
		protected $injector: IInjector) {
		super($nsCloudAuthenticationService, $logger, $injector);
	}

	protected get proxyService(): IServerServicesProxy {
		return this.$injector.resolve("nsCloudMBaasProxy");
	}
}

$injector.register("nsCloudMBaasRequestService", MBaasRequestService);
