interface IGitService {
	gitPushChanges(projectSettings: INSCloudProjectSettings, remoteUrl: IRemoteUrl, codeCommitCredential: ICodeCommitCredentials, repositoryState?: IRepositoryState): Promise<void>;
}

interface IRepositoryState {
	isNewRepository: boolean;
}
