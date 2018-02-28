import { KINVEY_SERVICE_NAME, HTTP_METHODS } from "../../../constants";
import { ServerServiceBase } from "../server-service-base";

export class KinveyRequestService extends ServerServiceBase implements IKinveyRequestService {
	public get serviceName(): string {
		return KINVEY_SERVICE_NAME;
	}

	constructor($injector: IInjector,
		$nsCloudMBaasRequestService: IServerRequestService) {
		super($nsCloudMBaasRequestService, $injector);
	}

	public createApp(input: ICreateKinveyAppInput): Promise<IKinveyApplication> {
		return this.sendRequest<IKinveyApplication>(HTTP_METHODS.POST, "apps", input);
	}

	public getApps(): Promise<IKinveyApplication[]> {
		return this.sendRequest<IKinveyApplication[]>(HTTP_METHODS.GET, "apps", null);
	}

	public getApp(id: string): Promise<IKinveyApplication> {
		return this.sendRequest<IKinveyApplication>(HTTP_METHODS.GET, `apps/${id}`, null);
	}

	public createIdentityStore(input: ICreateKinveyIdentityStoreInput): Promise<IKinveyIdentityStore> {
		return this.sendRequest<IKinveyIdentityStore>(HTTP_METHODS.POST, "identity-stores", input);
	}

	public getIdentityStores(): Promise<IKinveyIdentityStore[]> {
		return this.sendRequest<IKinveyIdentityStore[]>(HTTP_METHODS.GET, "identity-stores", null);
	}

	public getIdentityStore(id: string): Promise<IKinveyIdentityStore> {
		return this.sendRequest<IKinveyIdentityStore>(HTTP_METHODS.GET, `identity-stores/${id}`, null);
	}

	public getIdentityStoreAuthServices(id: string): Promise<IKinveyAuthService[]> {
		return this.sendRequest<IKinveyAuthService[]>(HTTP_METHODS.GET, `identity-stores/${id}/auth-services`, null);
	}

	public createAuthService(input: IKinveyAuthService): Promise<IKinveyAuthService> {
		return this.sendRequest<IKinveyAuthService>(HTTP_METHODS.POST, "auth-services", input);
	}

	public getAuthServices(): Promise<IKinveyAuthService[]> {
		return this.sendRequest<IKinveyAuthService[]>(HTTP_METHODS.GET, `auth-services`, null);
	}

	public getAuthService(id: string): Promise<IKinveyAuthService> {
		return this.sendRequest<IKinveyAuthService>(HTTP_METHODS.GET, `auth-services/${id}`, null);
	}

	public updateAuthService(id: string, input: IKinveyAuthServiceRequestInput): Promise<IKinveyAuthService> {
		return this.sendRequest<IKinveyAuthService>(HTTP_METHODS.PUT, `auth-services/${id}`, input);
	}

	public getEnvironment(id: string): Promise<IKinveyAppEnvironment> {
		return this.sendRequest<IKinveyAppEnvironment>(HTTP_METHODS.GET, `environments/${id}`, null);
	}

	public updateEnvironment(input: IKinveyAppEnvironment): Promise<IKinveyAppEnvironment> {
		return this.sendRequest<IKinveyAppEnvironment>(HTTP_METHODS.PUT, `environments/${input.id}`, input);
	}
}

$injector.register("nsCloudKinveyRequestService", KinveyRequestService);

