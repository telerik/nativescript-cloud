interface IServerBuildService {
	startBuild(buildRequest: IBuildRequestData): Promise<IServerResponse>;
	getPresignedUploadUrlObject(fileName: string): Promise<IAmazonStorageEntry>;
	getBuildCredentials(buildCredentialRequest: IBuildCredentialRequest): Promise<IBuildCredentialResponse>;
	generateCodesignFiles(codesignRequestData: ICodeSignRequestData): Promise<IServerResponse>;
	publish(publishRequestData: IPublishRequestData): Promise<IServerResponse>;
	appleLogin(appleLoginRequestData: IAppleLoginRequestData): Promise<IServerResponse>;
}

interface IServerResponse {
	cloudOperationVersion: string;
	statusUrl: string;
	resultUrl: string;
	outputUrl: string;
	communicationChannel: ICloudChannelData;
}

interface IBuildFile {
	disposition: string;
	sourceUri: string;
}

/**
 * Describes data that can be passed to a server request in order to manipulate the workflow on the remote machines.
 */
interface IWorkflowRequestData {
	/**
	 * The url where the actual workflow can be found.
	 */
	workflowUrl: string;

	/**
	 * The name of the workflow.
	 */
	workflowName: string;
}

interface ICodeSignRequestData extends IAppId, IClean, ICredentials, ISharedCloud, ICloudOperationId {
	appName: string;
	devices: Mobile.IDeviceInfo[];
}

interface IAccountId {
	accountId: string
}

interface IBuildRequestData extends IAccountId, IServerRequestData, IOptionalMachineId, ICloudOperationId {
	targets: string[];
	buildFiles: IBuildFile[];
	workflow?: IWorkflowRequestData;
}

interface IAppId {
	appId: string;
}

interface IBuildCredentialRequest extends IAppId {
	fileNames: string[];
}

interface IBuildCredentialResponse {
	codeCommit: IGetRepositoryResponse;
	urls: IAmazonStorageEntry[];
	sessionKey: string;
	codeCommitUrl: string;
}

interface IAmazonStorageEntry {
	uploadPreSignedUrl: string;
	publicDownloadUrl: string;
	fileName: string;
}

interface IPublishCredentials extends IApple2FAOptions {
	username?: string;
	password?: string;
	authJson?: string;
}

interface IPublishRequestData extends IPlatform, IPackagePaths, IOptionalAndroidTrack, IOptionalTeamIdentifier, ICloudOperationId {
	credentials: IPublishCredentials;
	appIdentifier?: string;
	sharedCloud?: boolean;
}

interface IServerRequestData {
	properties: IDictionary<any>;
}

interface IAppleLoginRequestData extends ICloudOperationId {
	credentials: ICredentials;
}
