interface IBuildCloudService {
	startBuild(appId: string, buildRequest: IBuildRequestData): Promise<IBuildResponse>;
	getPresignedUploadUrlObject(appId: string, fileName: string): Promise<IAmazonStorageEntry>;
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

interface IAmazonStorageEntry {
	uploadPreSignedUrl: string;
	publicDownloadUrl: string;
	s3Url: string;
	sessionKey: string;
}
