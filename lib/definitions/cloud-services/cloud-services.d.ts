interface IRequestBodyElement {
	name: string;
	value: any;
	contentType: string;
}

interface ICloudServicesProxy extends ICloudRequestService {
	getServiceAddress(serviceName: string): string;
	getServiceProto(serviceName: string): string;
	getUrlPath(serviceName: string, urlPath: string): string;
}

interface IUploadService {
	uploadToS3(localFilePath: string, requestHeaders?: any): Promise<string>;
}

interface IEmulatorCredentials {
	[key: string]: ICloudEmulatorKeys;
}

interface ICloudEmulatorService {
	startEmulator(publicKey: string, platform: string, deviceType: string): Promise<any>;
	deployApp(fileLocation: string, platform: string): Promise<ICloudEmulatorResponse>;
	refereshEmulator(deviceIdentifier: string): Promise<void>;
}

interface IAmazonStorageEntryData extends IAmazonStorageEntry {
	filePath: string;
	disposition: string;
}

interface ICloudEmulatorResponse {
	appPermissions: any;
	appURL: string;
	architectures: [string];
	created: Date;
	email: string;
	manageURL: string;
	platform: string;
	privateKey: string;
	publicKey: string;
	publicURL: string;
	updated: Date;
	versionCode: Number;
}

interface IPresignURLResponse {
	uploadPreSignedUrl: string;
	publicDownloadUrl: string;
	s3Url: string;
	sessionKey: string;
}

interface ICloudEmulatorKeys {
	publicKey: string;
	privateKey: string;
}

interface ICloudRequestService {
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
}
