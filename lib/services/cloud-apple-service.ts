import * as uuid from "uuid";
import { CloudService } from "./cloud-service";

export class CloudAppleService extends CloudService implements ICloudAppleService {
	protected silent = false;
	protected get failedError() {
		return "Apple login failed.";
	}

	protected get failedToStartError() {
		return "Failed to start Apple login.";
	}

	constructor($errors: IErrors,
		$fs: IFileSystem,
		$httpClient: Server.IHttpClient,
		$logger: ILogger,
		$injector: IInjector,
		$nsCloudS3Service: IS3Service,
		$nsCloudOutputFilter: ICloudOutputFilter,
		$processService: IProcessService,
		private $nsCloudServerBuildService: IServerBuildService) {
		super($errors, $fs, $httpClient, $logger, $injector, $nsCloudS3Service, $nsCloudOutputFilter, $processService);
	}

	public async appleLogin(credentials: ICredentials): Promise<string> {
		const cloudOperationId = uuid.v4();
		try {
			this.$logger.info(`Starting Apple login, cloudOperationId: ${cloudOperationId}`);
			const appleLoginData: IAppleLoginRequestData = { cloudOperationId, credentials };
			const response = await this.$nsCloudServerBuildService.appleLogin(appleLoginData);

			this.$logger.trace("Apple login response", response);
			let appleLoginResult = await this.waitForServerOperationToFinish(appleLoginData.cloudOperationId, response);
			return appleLoginResult.data.appleSessionBase64;
		} catch (err) {
			err.cloudOperationId = cloudOperationId;
			throw err;
		}
	}

	public getServerOperationOutputDirectory(options: IOutputDirectoryOptions): string {
		return "";
	}

	protected getServerResults(serverResult: ICloudOperationResult): IServerItem[] {
		return [];
	}
}

$injector.register("nsCloudAppleService", CloudAppleService);
