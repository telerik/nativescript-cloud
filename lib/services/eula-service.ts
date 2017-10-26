import * as path from "path";
import { EulaConstants } from "../constants";

export class EulaService implements IEulaService {
	private isEulaDownloadedInCurrentProcess = false;

	private get pathToEula(): string {
		return path.join(this.$options.profileDir, "EULA.pdf");
	}

	constructor(private $httpClient: Server.IHttpClient,
		private $userSettingsService: IUserSettingsService,
		private $logger: ILogger,
		private $fs: IFileSystem,
		private $options: IOptions) {

	}

	// CLI always uses this one
	public async getEulaDataWithCache(): Promise<IEulaData> {
		await this.downloadEulaIfRequired();

		return this.getEulaDataCore();
	}

	// Exposed for Sidekick
	public async getEulaData(): Promise<IEulaData> {
		await this.downloadLatestEula();

		return this.getEulaDataCore();
	}

	private async getEulaDataCore(): Promise<IEulaData> {
		const shouldAcceptEula = await this.getShouldAcceptLocalEula();

		this.$logger.trace(`Checked EULA state - shouldAcceptEula is ${shouldAcceptEula}.`);

		return {
			url: EulaConstants.eulaUrl,
			shouldAcceptEula
		};
	}

	private async getShouldAcceptLocalEula(): Promise<boolean> {
		const acceptedEulaHash = await this.$userSettingsService.getSettingValue<string>(EulaConstants.acceptedEulaHashKey);
		if (!acceptedEulaHash) {
			this.$logger.trace(`Checking EULA state: no EULA has been accepted so far.`);
			return true;
		}

		const currentEulaHash = await this.getLocalEulaHash();
		if (!currentEulaHash) {
			this.$logger.trace("No local copy of EULA found - as user had already accepted previous version of the EULA, consider it as the current one, so no need to accept new.");
			return false;
		}

		this.$logger.trace(`Checking EULA state: acceptedEulaHash is ${acceptedEulaHash}, currentEulaHash is ${currentEulaHash}.`);

		return acceptedEulaHash !== currentEulaHash;
	}

	public async acceptEula(): Promise<void> {
		const currentEulaHash = await this.getCurrentEulaHash();
		this.$logger.trace(`Accepting EULA with hash ${currentEulaHash}.`);
		await this.$userSettingsService.saveSetting<string>(EulaConstants.acceptedEulaHashKey, currentEulaHash);
		this.$logger.info("EULA has been accepted.");
	}

	// cache
	private async downloadLatestEula(): Promise<void> {
		if (this.isEulaDownloadedInCurrentProcess) {
			this.$logger.trace("EULA is already downloaded in current process. Skip new download.");
			return;
		}

		this.$logger.trace(`Downloading EULA to ${this.pathToEula}.`);

		await this.$httpClient.httpRequest({
			url: EulaConstants.eulaUrl,
			pipeTo: this.$fs.createWriteStream(this.pathToEula),
			timeout: EulaConstants.timeout
		});

		this.$logger.trace(`Successfully downloaded EULA to ${this.pathToEula}.`);

		this.isEulaDownloadedInCurrentProcess = true;
	}

	private async downloadEulaIfRequired(): Promise<void> {
		if (this.isEulaDownloadedInCurrentProcess) {
			this.$logger.trace("EULA is already downloaded in current process. A new download is not required.");

			return;
		}

		// download file only in case it has not been modified in the last 24 hours
		const eulaFstat = this.$fs.exists(this.pathToEula) && this.$fs.getFsStats(this.pathToEula);
		const timeToCheck = 24 * 60 * 60 * 1000; // 24 hours
		const currentTime = new Date().getTime();

		// TODO: Tests
		const shouldDownloadEula = !eulaFstat || (currentTime - eulaFstat.mtime.getTime()) > timeToCheck;
		if (shouldDownloadEula) {
			await this.downloadLatestEula();
		}
	}

	private async getCurrentEulaHash(): Promise<string> {
		await this.downloadLatestEula();

		const localEulaHash = await this.getLocalEulaHash();
		this.$logger.trace(`Downloaded latest EULA, its hash is: ${localEulaHash}.`);

		return localEulaHash;
	}

	private async getLocalEulaHash(): Promise<string> {
		if (this.$fs.exists(this.pathToEula)) {
			return this.$fs.getFileShasum(this.pathToEula, { algorithm: "sha256", encoding: "hex" });
		}

		return null;
	}
}

$injector.register("nsCloudEulaService", EulaService);
