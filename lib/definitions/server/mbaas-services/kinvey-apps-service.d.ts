interface IKinveyApplication {
	name: string;
	platform?: string[];
	url?: string[];
	organizationId?: string;
	featureFlags?: string[];
	realtime?: IRealTime;
	icon?: string;
	owner?: string;
	schemaVersion?: number;
	pendingOwner?: string;
	environments: IKinveyAppEnvironment[]
	id: string;
	paymentMethod?: string;
	plan?: IKinveyAppPlan;
}

interface IRealTime {
	enabled: boolean;
}

interface IKinveyAppEnvironment {
	id: string;
	app: string;
	appSecret: string;
	masterSecret: string;
	lockdownWarning?: boolean;
	archived?: boolean;
	unarchiving?: boolean;
	numberOfCollaborators: number;
	numberOfAdmins: number;
	lockdown?: boolean;
	maintenance?: boolean;
	name: string;
	apiVersion: number;
	passwordReset?: string;
	kasApiVersion?: number;
	emilVerification?: IKinveyEmailVerification;
	identityStoreId?: string;
	defaultAuthServiceId?: string;
}

interface IKinveyEmailVerification {
	auto?: boolean;
	required: boolean;
	since?: string;
}

interface IKinveyAppPlan {
	backup?: boolean;
	bl?: IKinveyBusinessLogic;
	collaborators?: number | boolean;
	datalinks?: number | boolean;
	email?: number | boolean;
	environments?: number;
	level?: string;
	push?: number | boolean;
	support?: IKinveySupport;
}

interface IKinveyBusinessLogic {
	timeout: number;
}

interface IKinveySupport {
	debug: boolean;
	email: boolean;
	phone: boolean;
}

interface ICreateKinveyAppInput {
	name: string;
	platform?: string[];
	url?: string[];
	organizationId?: string;
	featureFlags?: string[];
}
