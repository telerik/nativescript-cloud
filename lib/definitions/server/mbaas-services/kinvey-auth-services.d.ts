interface IKinveyAuthServiceRequestInput {
	name: string;
	customizedLogin?: IKinveyCustomizedLogin;
	redirectUri: string[];
	grantTtl?: number;
	tokenTtl?: number;
	refresh?: boolean;
	refreshTtl?: number;
	provider: IKinveyAuthProvider;
	access: IKinveyAuthServiceAccess;
	description?: string;
	identityStoreId: string;
}

interface IKinveyAuthService extends IKinveyAuthServiceRequestInput {
	id: string;
}

interface IKinveyCustomizedLogin {
	type: string;
	url: string;
}

interface IKinveyAuthServiceAccess {
	writers: IKinveyAccessWriters;
	readers: IKinveyAccessReaders;
}

interface IKinveyAuthProvider {
	type: string;
	remoteService: string;
	authentication?: IKinveyAuthProviderAuthentication | string;
	options: IKinveyAuthProviderOptions;
	allowedAttributes?: string[];
	datalinkHeaderMapping?: any;
	uniqueUserContextField?: string;
}

type IKinveyAuthProviderOptions = IKinveySamlRedirectOptions | IKinveyOAuth2Options | IKinveyOIDCOptions;

interface IKinveyAuthProviderAuthentication {
	username: string;
	password: string;
}

interface IKinveySamlRedirectOptions {
	wrapScope?: string;
	baseDn?: string;
	logoutUri?: string;
	idpCertificate?: string;
	proxy?: boolean;
	nameIdFormat?: string;
	key?: string;
	issuer?: string;
	audiance?: string;
}

interface IKinveyOAuthOptionsBase {
	grantEndpoint: string;
	clientId: string;
	clientSecret: string;
	userIdAttribute: string;
	userIdEndpoint: string;
	scope: string;
	grantType: string;
}

interface IKinveyOAuth2Options extends IKinveyOAuthOptionsBase {
	includeClientIdInTokenRequest: boolean;
	includeClientSecretInTokenRequest: boolean;
}

interface IKinveyOIDCOptions extends IKinveyOAuthOptionsBase {
	issuerId: string;
}

interface ICreateKinveyAuthService {
	appId: string;
	environmentId: string;
	redirectUri: string[];
	authServiceOptions: IKinveyAuthServiceRequestInput;
	identityStoreOptions?: ICreateKinveyIdentityStoreInput;
}

interface IUpdateKinveyAuthService {
	authServiceId: string;
	authService: IKinveyAuthServiceRequestInput;
}

interface IGetKinveyAuthServices {
	environmentId: string;
}

interface IGetDefaultKinveyAuthService {
	environmentId: string;
}

interface IChangeDefaultKinveyAuthService {
	envronmentId: string;
	authServiceId: string;
	identityStoreId: string;
}