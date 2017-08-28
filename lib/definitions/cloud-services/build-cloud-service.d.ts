interface IBuildCloudService {
	startBuild(appId: string, buildRequest: IBuildRequestData): Promise<IServerResponse>;
	getPresignedUploadUrlObject(appId: string, fileName: string): Promise<IAmazonStorageEntry>;
	getBuildCredentials(buildCredentialRequest: IBuildCredentialRequest): Promise<IBuildCredentialResponse>;
	generateCodesignFiles(codesignRequestData: IServerRequestData): Promise<IServerResponse>;
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

interface IBuildRequestData extends IServerRequestData {
	targets: string[];
	buildFiles: IBuildFile[];
}

interface IBuildCredentialRequest {
	appId: string;
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

interface IServerRequestData {
	properties: IDictionary<any>;
}
