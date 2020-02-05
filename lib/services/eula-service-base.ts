import * as path from "path";
import { EulaConstants } from "../constants";

export abstract class EulaServiceBase implements IEulaService {
	private isEulaDownloadedInCurrentProcess = false;

	constructor(private $fs: IFileSystem,
		private $httpClient: Server.IHttpClient,
		private $nsCloudLockService: ILockService,
		private $logger: ILogger,
		private $nsCloudHashService: IHashService,
		private $settingsService: ISettingsService,
		private $userSettingsService: IUserSettingsService,
		private $nsCloudTempService: ITempService) { }

	// Exposed for Sidekick
	public getEulaData(): Promise<IEulaData> {
		return this.getEulaDataWithCache();
	}

	// CLI always uses this one
	public async getEulaDataWithCache(): Promise<IEulaData> {
		await this.downloadLatestEula();

		return this.getEulaDataCore();
	}

	public async acceptEula(): Promise<void> {
		const currentEulaHash = await this.getCurrentEulaHash();
		this.$logger.trace(`Accepting EULA with hash ${currentEulaHash}.`);
		await this.setAcceptedEulaHash(currentEulaHash);
		this.$logger.info("EULA has been accepted.");
	}

	protected abstract getAcceptedEulaHashPropertyName(): string;

	protected abstract getEulaFileName(): string;

	protected abstract getEulaUrl(): string;

	private async getEulaDataCore(): Promise<IEulaData> {
		const shouldAcceptEula = await this.getShouldAcceptLocalEula();

		this.$logger.trace(`Checked ${this.getEulaFileName()} state - shouldAcceptEula is ${shouldAcceptEula}.`);

		return {
			url: EulaConstants.eulaUrl,
			shouldAcceptEula
		};
	}

	private async getShouldAcceptLocalEula(): Promise<boolean> {
		const acceptedEulaHash = await this.getAcceptedEulaHash();
		if (!acceptedEulaHash) {
			this.$logger.trace(`Checking ${this.getPathToEula()} state: no EULA has been accepted so far.`);
			return true;
		}

		// At this point we should have already downloaded the EULA, so just get the info for local file.
		// If it does not exist - we were unable to download it.
		const currentEulaHash = await this.getLocalEulaHash();
		if (!currentEulaHash) {
			this.$logger.trace(`Checking ${this.getPathToEula()} state: no local copy of EULA found - as user had already accepted previous version of the EULA, consider it as the current one, so no need to accept new.`);
			return false;
		}

		this.$logger.trace(`Checking ${this.getPathToEula()} state: acceptedEulaHash is ${acceptedEulaHash}, currentEulaHash is ${currentEulaHash}.`);
		return acceptedEulaHash !== currentEulaHash;
	}

	private async downloadLatestEula(opts: { forceDownload: boolean } = { forceDownload: false }): Promise<void> {
		if (this.isEulaDownloadedInCurrentProcess) {
			this.$logger.trace("EULA is already downloaded in current process. Skip new download.");
			return;
		}

		try {
			const tempEulaPath = await this.$nsCloudTempService.path({ prefix: "eula", suffix: ".pdf" });

			this.$logger.trace(`Downloading EULA to ${this.getPathToEula()}.`);

			const eulaFstat = this.getEulaFsStat();

			const result = await this.$httpClient.httpRequest({
				url: this.getEulaUrl(),
				pipeTo: this.$fs.createWriteStream(tempEulaPath),
				headers: eulaFstat && !opts.forceDownload ? { "If-Modified-Since": eulaFstat.mtime.toUTCString() } : {},
				timeout: EulaConstants.timeout
			});

			if (result.response.statusCode !== 304) {
				const lockFilePath = this.getLockFilePath("download.lock");
				await this.$nsCloudLockService.executeActionWithLock(async () => {
					this.$logger.trace(`Successfully downloaded EULA to ${tempEulaPath}.`);
					this.$fs.copyFile(tempEulaPath, this.getPathToEula());
					this.$logger.trace(`Successfully copied EULA to ${this.getPathToEula()}.`);
				}, lockFilePath, this.getLockOptions());
			}

			this.isEulaDownloadedInCurrentProcess = true;
		} catch (err) {
			if (opts.forceDownload) {
				this.$logger.trace("Unable to download latest EULA, but will rethrow the error as requested by caller. Error is:", err);

				throw err;
			}

			this.$logger.trace("Unable to download latest EULA. Error is:", err);
		}
	}

	private async getCurrentEulaHash(): Promise<string> {
		await this.downloadLatestEula({ forceDownload: true });

		const localEulaHash = await this.getLocalEulaHash();
		this.$logger.trace(`Downloaded latest ${this.getPathToEula()}, its hash is: ${localEulaHash}.`);

		return localEulaHash;
	}

	private async getLocalEulaHash(): Promise<string> {
		const pathToEula = this.getPathToEula();
		const localEulaHash = this.$fs.exists(pathToEula) && await this.$nsCloudHashService.getLocalFileHash(pathToEula);
		this.$logger.trace(`Downloaded latest ${this.getPathToEula()}, its hash is: ${localEulaHash}.`);
		return localEulaHash;
	}

	private getLockOptions(): ILockOptions {
		// We'll retry 100 times and time between retries is 100ms, i.e. full wait in case we are unable to get lock will be 10 seconds.
		// In case lock is older than 13 seconds, consider it stale and try to get a new lock.
		return {
			retryWait: 100,
			retries: 100,
			stale: 13 * 1000
		};
	}

	private getLockFilePath(lockFileName: string): string {
		const dirName = path.dirname(this.getPathToEula());
		const eulaName = path.parse(this.getPathToEula()).name;
		return path.join(dirName, `${eulaName}.${lockFileName}`);
	}

	private getAcceptedEulaHash(): Promise<string> {
		const propertyName = this.getAcceptedEulaHashPropertyName();
		return this.$userSettingsService.getSettingValue<string>(propertyName);
	}

	private setAcceptedEulaHash(hash: string): Promise<void> {
		const propertyName = this.getAcceptedEulaHashPropertyName();
		return this.$userSettingsService.saveSetting<string>(propertyName, hash);
	}

	private getEulaFsStat() {
		return this.$fs.exists(this.getPathToEula()) && this.$fs.getFsStats(this.getPathToEula());
	}

	private getPathToEula(): string {
		return path.join(this.$settingsService.getProfileDir(), this.getEulaFileName());
	}
}
