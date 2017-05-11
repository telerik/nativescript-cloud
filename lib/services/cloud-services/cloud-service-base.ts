import { CONTENT_TYPES } from "../../constants";

export abstract class CloudServiceBase {
	protected abstract serviceName: string;

	constructor(protected $cloudServicesProxy: ICloudServicesProxy) { }

	protected sendRequest<T>(method: string, urlPath: string, body: any, headers?: any, resultStream?: NodeJS.WritableStream): Promise<T> {
		return this.$cloudServicesProxy.call<T>(this.serviceName,
			method,
			urlPath,
			this.createJsonBody(body),
			CONTENT_TYPES.APPLICATION_JSON,
			headers,
			resultStream);
	}

	private createJsonBody(body: any): IRequestBodyElement[] {
		if (!body) {
			return null;
		}

		if (typeof (body) !== "string") {
			body = JSON.stringify(body);
		}

		return [{
			contentType: CONTENT_TYPES.APPLICATION_JSON,
			value: body,
			name: "body"
		}];
	}
}
