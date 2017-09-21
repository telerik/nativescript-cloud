interface IBuildCloudService {
	startBuild(buildRequest: IBuildRequestData): Promise<IServerResponse>;
	getPresignedUploadUrlObject(fileName: string): Promise<IAmazonStorageEntry>;
	getBuildCredentials(buildCredentialRequest: IBuildCredentialRequest): Promise<IBuildCredentialResponse>;
	generateCodesignFiles(codesignRequestData: ICodeSignRequestData): Promise<IServerResponse>;
	publish(publishRequestData: IPublishRequestData): Promise<IServerResponse>;
}

interface IServerResponse {
	statusUrl: string;
	resultUrl: string;
	outputUrl: string;
}

interface IBuildFile {
	disposition: string;
	sourceUri: string;
}

interface ICodeSignRequestData extends IBuildId, IAppId, IClean, ICredentials {
	appName: string;
	devices: Mobile.IDeviceInfo[];
}

interface IBuildRequestData extends IServerRequestData {
	targets: string[];
	buildFiles: IBuildFile[];
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
	s3Url: string;
	fileName: string;
}

interface IPublishCredentials {
	username?: string;
	password?: string;
	authJson?: string;
}

interface IPublishRequestData extends IPlatform, IPackagePaths, IOptionalAndroidTrack, IOptionalTeamIdentifier {
	credentials: IPublishCredentials;
	appIdentifier?: string;
}

interface IServerRequestData {
	properties: IDictionary<any>;
}
