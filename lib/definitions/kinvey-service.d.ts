interface IKinveyService {
	getApps(): Promise<IKinveyApplication[]>;
	createApp(input: ICreateKinveyAppInput): Promise<IKinveyApplication>;
	createAuthService(input: ICreateKinveyAuthService): Promise<IKinveyAuthService>;
	updateAuthService(input: IUpdateKinveyAuthService): Promise<IKinveyAuthService>;
	getAuthServices(input: IGetKinveyAuthServices): Promise<IDictionary<IKinveyAuthService[]>>;
	getDefaultAuthService(input: IGetDefaultKinveyAuthService): Promise<IKinveyAuthService>;
	changeDefaultAuthService(input: IChangeDefaultKinveyAuthService): Promise<IKinveyAuthService>;
}
