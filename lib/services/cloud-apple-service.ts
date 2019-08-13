import { CloudService } from "./cloud-service";

export class CloudAppleService extends CloudService implements ICloudAppleService {
	protected get failedError() {
		return "Apple login failed.";
	}

	protected get failedToStartError() {
		return "Failed to start Apple login.";
	}

	constructor($constants: IDictionary<any>,
		$nsCloudErrorsService: IErrors,
		$fs: IFileSystem,
		$httpClient: Server.IHttpClient,
		$logger: ILogger,
		$nsCloudOperationFactory: ICloudOperationFactory,
		$nsCloudOutputFilter: ICloudOutputFilter,
		$nsCloudProcessService: IProcessService,
		private $nsCloudServerBuildService: IServerBuildService) {
		super($nsCloudErrorsService, $fs, $httpClient, $logger, $constants, $nsCloudOperationFactory, $nsCloudOutputFilter, $nsCloudProcessService);
	}

	public async appleLogin(credentials: ICredentials): Promise<string> {
		const result = await this.executeCloudOperation("Apple login", async (cloudOperationId: string): Promise<string> => {
			const appleLoginData: IAppleLoginRequestData = { cloudOperationId, credentials };
			const response = await this.$nsCloudServerBuildService.appleLogin(appleLoginData);

			this.$logger.trace("Apple login response", response);
			let appleLoginResult = await this.waitForCloudOperationToFinish(appleLoginData.cloudOperationId, response, { silent: true });
			if (!appleLoginResult.data || !appleLoginResult.data.appleSessionBase64) {
				this.$nsCloudErrorsService.fail(`Apple login failed. Reason is: ${appleLoginResult.errors}. Additional information: ${appleLoginResult.stderr || appleLoginResult.stdout}.`);
			}

			return appleLoginResult.data.appleSessionBase64;
		});

		return result;
	}
}

$injector.register("nsCloudAppleService", CloudAppleService);
