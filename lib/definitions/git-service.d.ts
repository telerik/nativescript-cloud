interface IGitService {
	gitPushChanges(projectDir: string, remoteUrl: IRemoteUrl, codeCommitCredential: ICodeCommitCredentials, repositoryState?: IRepositoryState): Promise<void>;
}

interface IRepositoryState {
	isNewRepository: boolean;
}
