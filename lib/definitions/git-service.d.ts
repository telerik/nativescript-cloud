interface ICodeCommitCredentials {
	accessKeyId: string;
	expiration: string;
	secretAccessKey: string;
	sessionToken: string;
}

interface IRemoteUrl {
	httpRemoteUrl: string;
}

interface IGitService {
	gitPushChanges(projectSettings: INSCloudProjectSettings, remoteUrl: IRemoteUrl, codeCommitCredential: ICodeCommitCredentials, repositoryState?: IRepositoryState): Promise<void>;
}

interface IRepositoryState {
	isNewRepository: boolean;
}
