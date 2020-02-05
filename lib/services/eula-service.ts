import { EulaConstants } from "../constants";
import { EulaServiceBase } from "./eula-service-base";

export class EulaService extends EulaServiceBase implements IEulaService {
	constructor($fs: IFileSystem,
		$httpClient: Server.IHttpClient,
		$nsCloudLockService: ILockService,
		$logger: ILogger,
		$nsCloudHashService: IHashService,
		$settingsService: ISettingsService,
		$userSettingsService: IUserSettingsService,
		$nsCloudTempService: ITempService) {
		super($fs, $httpClient, $nsCloudLockService, $logger, $nsCloudHashService, $settingsService, $userSettingsService, $nsCloudTempService);
	}

	protected getAcceptedEulaHashPropertyName(): string {
		return EulaConstants.acceptedEulaHashKey;
	}

	protected getEulaFileName(): string {
		return "EULA.pdf";
	}

	protected getEulaUrl(): string {
		return EulaConstants.eulaUrl;
	}
}

$injector.register("nsCloudEulaService", EulaService);
