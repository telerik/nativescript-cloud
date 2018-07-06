import { EulaConstants } from "../constants";
import { EulaServiceBase } from "./eula-service-base";

export class EulaService extends EulaServiceBase implements IEulaService {
	constructor($fs: IFileSystem,
		$httpClient: Server.IHttpClient,
		$lockfile: ILockFile,
		$logger: ILogger,
		$nsCloudHashService: IHashService,
		$settingsService: ISettingsService,
		$userSettingsService: IUserSettingsService) {
		super($fs, $httpClient, $lockfile, $logger, $nsCloudHashService, $settingsService, $userSettingsService);
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
