import { EulaConstants } from "../constants";
import { EulaServiceBase } from "./eula-service-base";

// TODO: Remove in 2.0.0 - currently this service is not used, but it has been publicly exposed, so we cannot remove it without bumping the major version.
export class KinveyEulaService extends EulaServiceBase implements IEulaService {
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
