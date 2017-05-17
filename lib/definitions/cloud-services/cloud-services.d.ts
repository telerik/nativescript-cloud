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
