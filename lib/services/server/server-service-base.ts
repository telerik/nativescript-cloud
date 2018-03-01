import { CONTENT_TYPES } from "../../constants";

export abstract class ServerServiceBase {
	protected abstract serviceName: string;

	protected get $errors(): IErrors {
		return this.$injector.resolve<IErrors>("errors");
	}

	private get $nsCloudEulaService(): IEulaService {
		return this.$injector.resolve<IEulaService>("nsCloudEulaService");
	}

	constructor(protected requestService: IServerRequestService,
		private $injector: IInjector) { }

	protected async sendRequest<T>(method: string, urlPath: string, body: any, headers?: any, resultStream?: NodeJS.WritableStream): Promise<T> {
		await this.ensureEulaIsAccepted();

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

	protected async ensureEulaIsAccepted(): Promise<void> {
		const eulaData = await this.$nsCloudEulaService.getEulaDataWithCache();
		if (eulaData.shouldAcceptEula) {
			this.$errors.failWithoutHelp(`EULA is not accepted, cannot use cloud services.`);
		}
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
