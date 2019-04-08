interface IRequestBodyElement {
	name: string;
	value: any;
	contentType: string;
}

interface IServerServicesProxy extends IServerRequestService {
	getServiceProto(serviceName: string): string;
	getUrlPath(serviceName: string, urlPath: string): string;
}

interface IUploadService {
	uploadToS3(filePathOrContent: string, fileNameInS3?: string, uploadPreSignedUrl?: string): Promise<string>;
}

interface IAmazonStorageEntryData extends IAmazonStorageEntry {
	filePath: string;
	disposition: string;
}

interface IPresignURLResponse {
	uploadPreSignedUrl: string;
	publicDownloadUrl: string;
}

interface IServerRequestService {
	call<T>(options: ICloudRequestOptions): Promise<T>;
}

interface ICloudRequestOptions {
	accept: string;
	bodyValues: IRequestBodyElement[];
	headers: any;
	method: string;
	resultStream: NodeJS.WritableStream;
	serviceName: string;
	urlPath: string;
	timeout?: number;
}
