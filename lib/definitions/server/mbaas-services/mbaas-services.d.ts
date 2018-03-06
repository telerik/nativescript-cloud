interface IKinveyRequestService {
	// Apps.
	createApp(input: ICreateKinveyAppInput): Promise<IKinveyApplication>;
	getApps(): Promise<IKinveyApplication[]>;
	getApp(id: string): Promise<IKinveyApplication>;

	// Identity Stores.
	createIdentityStore(input: ICreateKinveyIdentityStoreInput): Promise<IKinveyIdentityStore>;
	getIdentityStores(): Promise<IKinveyIdentityStore[]>;
	getIdentityStore(id: string): Promise<IKinveyIdentityStore>;
	getIdentityStoreAuthServices(id: string): Promise<IKinveyAuthService[]>;

	// Auth Services.
	createAuthService(input: IKinveyAuthServiceRequestInput): Promise<IKinveyAuthService>;
	getAuthService(id: string): Promise<IKinveyAuthService>;
	updateAuthService(id: string, input: IKinveyAuthServiceRequestInput): Promise<IKinveyAuthService>;

	// Environments.
	getEnvironment(id: string): Promise<IKinveyAppEnvironment>;
	updateEnvironment(input: IKinveyAppEnvironment): Promise<IKinveyAppEnvironment>;
}
