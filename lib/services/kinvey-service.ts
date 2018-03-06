import { Authentication } from "../constants";

export class KinveyService implements IKinveyService {
	constructor(private $nsCloudKinveyRequestService: IKinveyRequestService) { }

	public getApps(): Promise<IKinveyApplication[]> {
		return this.$nsCloudKinveyRequestService.getApps();
	}

	public createApp(input: ICreateKinveyAppInput): Promise<IKinveyApplication> {
		return this.$nsCloudKinveyRequestService.createApp(input);
	}

	public async createAuthService(input: ICreateKinveyAuthService): Promise<IKinveyAuthService> {
		input.identityStoreOptions = input.identityStoreOptions || Object.create(null);

		const app = await this.$nsCloudKinveyRequestService.getApp(input.appId);
		const createIdentityStoreInput: ICreateKinveyIdentityStoreInput = {
			name: input.identityStoreOptions.name || this.getIdentityStoreName(app.name, input.authServiceOptions.provider.type, input.environmentId),
			access: input.identityStoreOptions.access || {
				writers: {
					environments: [input.environmentId]
				}
			}
		};

		const identityStore = await this.$nsCloudKinveyRequestService.createIdentityStore(createIdentityStoreInput);

		const createAuthServiceInput = this.getCreateAuthServiceInput(app.name, identityStore.id, input.redirectUri, input.authServiceOptions);
		const authService = await this.$nsCloudKinveyRequestService.createAuthService(createAuthServiceInput);

		const env = await this.$nsCloudKinveyRequestService.getEnvironment(input.environmentId);
		env.identityStoreId = identityStore.id;
		env.defaultAuthServiceId = authService.id;

		await this.$nsCloudKinveyRequestService.updateEnvironment(env);

		await this.changeDefaultAuthService({ envronmentId: input.environmentId, authServiceId: authService.id, identityStoreId: identityStore.id });

		return authService;
	}

	public updateAuthService(input: IUpdateKinveyAuthService): Promise<IKinveyAuthService> {
		// The Kinvey api does not accept {} for customized login.
		if (_.isEmpty(input.authService.customizedLogin)) {
			delete input.authService.customizedLogin;
		}

		// The Kinvey api does not accept null for provider.authentication.
		// The api docs say it should accept null but...
		if (_.isEmpty(input.authService.provider.authentication)) {
			delete input.authService.provider.authentication;
		}

		return this.$nsCloudKinveyRequestService.updateAuthService(input.authServiceId, input.authService);
	}

	public async getAuthServices(input: IGetKinveyAuthServices): Promise<IDictionary<IKinveyAuthService[]>> {
		const identityStores = await this.$nsCloudKinveyRequestService.getIdentityStores();
		const identityStoresForEnvironment = _.filter(identityStores, i => i.access.writers.environments.indexOf(input.environmentId) >= 0);

		const result: IDictionary<IKinveyAuthService[]> = {};
		for (let is of identityStoresForEnvironment) {
			result[is.id] = await this.$nsCloudKinveyRequestService.getIdentityStoreAuthServices(is.id);
		}

		return result;
	}

	public async getDefaultAuthService(input: IGetDefaultKinveyAuthService): Promise<IKinveyAuthService> {
		const env = await this.$nsCloudKinveyRequestService.getEnvironment(input.environmentId);
		if (!env.defaultAuthServiceId) {
			return null;
		}

		return this.$nsCloudKinveyRequestService.getAuthService(env.defaultAuthServiceId);
	}

	public async changeDefaultAuthService(input: IChangeDefaultKinveyAuthService): Promise<IKinveyAuthService> {
		const env = await this.$nsCloudKinveyRequestService.getEnvironment(input.envronmentId);
		env.identityStoreId = input.identityStoreId;
		env.defaultAuthServiceId = input.authServiceId;

		await this.$nsCloudKinveyRequestService.updateEnvironment(env);

		return this.getDefaultAuthService({ environmentId: input.envronmentId });
	}

	private getCreateAuthServiceInput(appName: string, isId: string, redirectUri: string[], createAuthServiceOptions: IKinveyAuthServiceRequestInput): IKinveyAuthServiceRequestInput {
		const result: IKinveyAuthServiceRequestInput = {
			name: createAuthServiceOptions.name || this.getAuthServiceName(appName, createAuthServiceOptions.provider.type, isId),
			identityStoreId: createAuthServiceOptions.identityStoreId || isId,
			redirectUri: createAuthServiceOptions.redirectUri || redirectUri,
			grantTtl: createAuthServiceOptions.grantTtl || 30,
			tokenTtl: createAuthServiceOptions.tokenTtl || 3600,
			refresh: _.has(createAuthServiceOptions, "refresh") ? createAuthServiceOptions.refresh : true,
			refreshTtl: createAuthServiceOptions.refreshTtl || 120960,
			customizedLogin: createAuthServiceOptions.customizedLogin,
			description: createAuthServiceOptions.description || `${appName} auth service`,
			access: createAuthServiceOptions.access,
			provider: this.getAuthProviderInput(createAuthServiceOptions.provider)
		};

		return result;
	}

	private getAuthProviderInput(provider: IKinveyAuthProvider): IKinveyAuthProvider {
		const result: IKinveyAuthProvider = {
			allowedAttributes: provider.allowedAttributes || ["id", "audience"],
			authentication: provider.authentication,
			datalinkHeaderMapping: provider.datalinkHeaderMapping || { "client_token": "X-Kinvey-Auth" },
			remoteService: provider.remoteService,
			type: provider.type,
			uniqueUserContextField: provider.uniqueUserContextField,
			options: this.getAuthProviderOptions(provider.type, provider.options)
		};

		return result;
	}

	private getAuthProviderOptions(providerType: string, options: IKinveyAuthProviderOptions): IKinveyAuthProviderOptions {
		if (providerType === Authentication.OAuth2) {
			const res: IKinveyOAuth2Options = <IKinveyOAuth2Options>options;
			res.grantType = res.grantType || "authorization-code";
			res.includeClientIdInTokenRequest = _.has(res, "includeClientIdInTokenRequest") ? res.includeClientIdInTokenRequest : false;
			res.includeClientSecretInTokenRequest = _.has(res, "includeClientSecretInTokenRequest") ? res.includeClientSecretInTokenRequest : false;
			return res;
		}

		if (providerType === Authentication.OIDC) {
			const res: IKinveyOIDCOptions = <IKinveyOIDCOptions>options;
			res.grantType = res.grantType || "authorization-code";
			return res;
		}

		return options;
	}

	private getAuthServiceName(appName: string, authType: string, isId: string): string {
		return `${appName}-${isId}-${authType}-auth-service`;
	}

	private getIdentityStoreName(appName: string, authType: string, envId: string): string {
		return `${appName}-${envId}-${authType}-identity-store`;
	}
}

$injector.register("nsCloudKinveyService", KinveyService);
