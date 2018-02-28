interface ICreateKinveyIdentityStoreInput {
	name: string;
	access: IKinveyIdentityStoreAccess;
}

interface IKinveyIdentityStoreAccess {
	writers: IKinveyIdentityStoreAccessWriters;
}

interface IKinveyIdentityStoreAccessWriters extends IKinveyAccessWriters {
	environments?: string[];
}

interface IKinveyIdentityStore extends ICreateKinveyIdentityStoreInput {
	id: string;
}
