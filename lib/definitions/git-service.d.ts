interface IGitService {
	gitPushChanges(projectDir: string, remoteUrl: IRemoteUrl, codeCommitCredential: ICodeCommitCredentials): Promise<void>;
}
