interface IServerCodeCommitService {
	getRepository(appId: string): Promise<IGetRepositoryResponse>;
	deleteRepository(appId: string): Promise<IDeleteRepositoryResponse>;
}

interface IGetRepositoryResponse {
	cloneUrlHttp: string;
	cloneUrlSsh: string;
	repositoryName: string;
	credentials: ICodeCommitCredentials;
	isNewRepository: boolean;
}

interface IRemoteUrl {
	httpRemoteUrl: string;
}

interface ICodeCommitCredentials {
	accessKeyId: string;
	expiration: string;
	secretAccessKey: string;
	sessionToken: string;
}

interface IDeleteRepositoryResponse {
	repositoryId: string;
}
