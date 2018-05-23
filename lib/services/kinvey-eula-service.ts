import { EulaConstants } from "../constants";
import { EulaServiceBase } from "./eula-service-base";

export class KinveyEulaService extends EulaServiceBase implements IEulaService {
	constructor($fs: IFileSystem,
		$httpClient: Server.IHttpClient,
		$lockfile: ILockFile,
		$logger: ILogger,
		$nsCloudDateTimeService: IDateTimeService,
		$nsCloudHashService: IHashService,
		$settingsService: ISettingsService,
		$userSettingsService: IUserSettingsService) {
		super($fs, $httpClient, $lockfile, $logger, $nsCloudDateTimeService, $nsCloudHashService, $settingsService, $userSettingsService);
	}

	protected getAcceptedEulaHashPropertyName(): string {
		return EulaConstants.acceptedKinveyEulaHashKey;
	}

	protected getEulaFileName(): string {
		return "Kinvey-EULA.pdf";
	}

	protected getEulaUrl(): string {
		return EulaConstants.kinveyEulaUrl;
	}
}

$injector.register("nsCloudKinveyEulaService", KinveyEulaService);
