interface IRequestBodyElement {
	name: string;
	value: any;
	contentType: string;
}

interface ICloudServicesProxy {
	call<T>(serviceName: string, method: string, urlPath: string, bodyValues: IRequestBodyElement[], accept: string, headers: any, resultStream: NodeJS.WritableStream): Promise<T>;
	getServiceAddress(serviceName: string): string;
	getServiceProto(serviceName: string): string;
	getUrlPath(serviceName: string, urlPath: string): string;
}
