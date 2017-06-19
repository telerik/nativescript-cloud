interface IBuildCloudService {
	startBuild(appId: string, buildRequest: IBuildRequestData): Promise<IBuildResponse>;
	getPresignedUploadUrlObject(appId: string, fileName: string): Promise<IAmazonStorageEntry>;
	getBuildCredentials(buildCredentialRequest: IBuildCredentialRequest): Promise<IBuildCredentialResponse>;
}

interface IBuildResponse {
	statusUrl: string;
	resultUrl: string;
	outputUrl: string;
}

interface IBuildFile {
	Disposition: string;
	SourceUri: string;
}

interface IBuildRequestData {
	Targets: string[];
	Properties: IDictionary<string>;
	BuildFiles: IBuildFile[];
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
