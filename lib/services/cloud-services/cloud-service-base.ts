import { CONTENT_TYPES } from "../../constants";

export abstract class CloudServiceBase {
	protected abstract serviceName: string;

	constructor(protected requestService: ICloudRequestService) { }

	protected sendRequest<T>(method: string, urlPath: string, body: any, headers?: any, resultStream?: NodeJS.WritableStream): Promise<T> {
		const requestOptions: ICloudRequestOptions = {
			serviceName: this.serviceName,
			method: method,
			urlPath: urlPath,
			bodyValues: this.createJsonBody(body),
			accept: CONTENT_TYPES.APPLICATION_JSON,
			headers: headers,
			resultStream: resultStream
		};

		return this.requestService.call<T>(requestOptions);
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
