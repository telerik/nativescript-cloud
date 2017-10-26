import { CONTENT_TYPES } from "../../constants";

export abstract class CloudServiceBase {
	protected abstract serviceName: string;

	private get $nsCloudEulaService(): IEulaService {
		return this.$injector.resolve<IEulaService>("nsCloudEulaService");
	}

	private get $errors(): IErrors {
		return this.$injector.resolve<IErrors>("errors");
	}

	constructor(protected requestService: ICloudRequestService,
		private $injector: IInjector) { }

	protected async sendRequest<T>(method: string, urlPath: string, body: any, headers?: any, resultStream?: NodeJS.WritableStream): Promise<T> {
		const eulaData = await this.$nsCloudEulaService.getEulaDataWithCache();
		if (eulaData.shouldAcceptEula) {
			this.$errors.failWithoutHelp(`EULA is not accepted, cannot use cloud services.`);
		}

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
