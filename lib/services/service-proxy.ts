
export class ServiceProxy implements CloudService.IServiceProxy {
	constructor(protected $httpClient: Server.IHttpClient,
		private $packageInfoService: IPackageInfoService,
		protected $logger: ILogger,
		protected $serverConfig: IServerConfiguration,
		protected $errors: IErrors) {
	}

	public async call<Т>(name: string, method: string, path: string, accept: string, bodyValues: CloudService.IRequestBodyElement[], resultStream: NodeJS.WritableStream, headers?: any): Promise<Т> {
		path = `appbuilder/${path}`;
		headers = headers || Object.create(null);
		headers["X-Icenium-SolutionSpace"] = headers["X-Icenium-SolutionSpace"] || "Private_Build_Folder";
		headers["User-Agent"] = `fusion/${this.$packageInfoService.getVersion()} (Node.js ${process.versions.node}; ${process.platform}; ${process.arch})`;

		if (accept) {
			headers.Accept = accept;
		}

		let requestOpts: any = {
			proto: this.$serverConfig.AB_SERVER_PROTO,
			host: this.$serverConfig.AB_SERVER,
			path: `/${path}`,
			method: method,
			headers: headers,
			pipeTo: resultStream
		};

		if (bodyValues) {
			if (bodyValues.length > 1) {
				throw new Error("TODO: CustomFormData not implemented");
			}

			let theBody = bodyValues[0];
			requestOpts.body = theBody.value;
			requestOpts.headers["Content-Type"] = theBody.contentType;
		}

		let response: Server.IResponse;
		try {
			response = await this.$httpClient.httpRequest(requestOpts);
		} catch (err) {
			if (err.response && err.response.statusCode === 402) {
				this.$errors.fail({ formatStr: "%s", suppressCommandHelp: true }, JSON.parse(err.body).Message);
			}

			throw err;
		}

		this.$logger.debug("%s (%s %s) returned %d", name, method, path, response.response.statusCode);

		const resultValue = accept === "application/json" ? JSON.parse(response.body) : response.body;

		return resultValue;
	}
}
$injector.register("serviceProxy", ServiceProxy);
