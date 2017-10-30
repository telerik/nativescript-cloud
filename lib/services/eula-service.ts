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
		private $nsCloudDateTimeService: IDateTimeService,
		private $lockfile: ILockFile,
		private $options: IOptions) { }

	// Exposed for Sidekick
	public async getEulaData(): Promise<IEulaData> {
		await this.downloadLatestEula();

		return this.getEulaDataCore();
	}

	// CLI always uses this one
	public async getEulaDataWithCache(): Promise<IEulaData> {
		await this.downloadEulaIfRequired();

		return this.getEulaDataCore();
	}

	public async acceptEula(): Promise<void> {
		const currentEulaHash = await this.getCurrentEulaHash();
		this.$logger.trace(`Accepting EULA with hash ${currentEulaHash}.`);
		await this.$userSettingsService.saveSetting<string>(EulaConstants.acceptedEulaHashKey, currentEulaHash);
		this.$logger.info("EULA has been accepted.");
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
			this.$logger.trace("Checking EULA state: no EULA has been accepted so far.");
			return true;
		}

		// At this point we should have already downloaded the EULA, so just get the info for local file.
		// If it does not exist - we were unable to download it.
		const currentEulaHash = await this.getLocalEulaHash();
		if (!currentEulaHash) {
			this.$logger.trace("Checking EULA state: no local copy of EULA found - as user had already accepted previous version of the EULA, consider it as the current one, so no need to accept new.");
			return false;
		}

		this.$logger.trace(`Checking EULA state: acceptedEulaHash is ${acceptedEulaHash}, currentEulaHash is ${currentEulaHash}.`);
		return acceptedEulaHash !== currentEulaHash;
	}

	private async downloadLatestEula(opts: { shouldThrowError: boolean } = { shouldThrowError: false }): Promise<void> {
		if (this.isEulaDownloadedInCurrentProcess) {
			this.$logger.trace("EULA is already downloaded in current process. Skip new download.");
			return;
		}

		const lockFilePath = this.getLockFilePath("eula.download.lock");
		try {
			await this.$lockfile.lock(lockFilePath, this.getLockFileParams());
			this.$logger.trace(`Downloading EULA to ${this.pathToEula}.`);

			await this.$httpClient.httpRequest({
				url: EulaConstants.eulaUrl,
				pipeTo: this.$fs.createWriteStream(this.pathToEula),
				timeout: EulaConstants.timeout
			});

			this.$logger.trace(`Successfully downloaded EULA to ${this.pathToEula}.`);

			this.isEulaDownloadedInCurrentProcess = true;
		} catch (err) {
			if (opts.shouldThrowError) {
				this.$logger.trace("Unable to download latest EULA, but will rethrow the error as requested by caller. Error is:", err);

				throw err;
			}

			this.$logger.trace("Unable to download latest EULA. Error is:", err);
		} finally {
			this.$lockfile.unlock(lockFilePath);
		}
	}

	private async downloadEulaIfRequired(): Promise<void> {
		if (this.isEulaDownloadedInCurrentProcess) {
			this.$logger.trace("EULA is already downloaded in current process. A new download is not required.");
			return;
		}

		const lockFilePath = this.getLockFilePath("eula.check_download.lock");
		try {
			await this.$lockfile.lock(lockFilePath, this.getLockFileParams());
			// download file only in case it has not been modified in the last 24 hours
			const eulaFstat = this.$fs.exists(this.pathToEula) && this.$fs.getFsStats(this.pathToEula);
			const timeToCheck = 24 * 60 * 60 * 1000;
			const currentTime = this.$nsCloudDateTimeService.getCurrentEpochTime();

			const shouldDownloadEula = !eulaFstat || ((currentTime - eulaFstat.mtime.getTime()) > timeToCheck);
			if (shouldDownloadEula) {
				this.$logger.trace("Will download new EULA as either local EULA does not exist or the cache time has passed.");
				await this.downloadLatestEula();
			}
		} finally {
			this.$lockfile.unlock(lockFilePath);
		}
	}

	private async getCurrentEulaHash(): Promise<string> {
		await this.downloadLatestEula({ shouldThrowError: true });

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

	private getLockFileParams(): ILockFileOptions {
		// We'll retry 100 times and time between retries is 100ms, i.e. full wait in case we are unable to get lock will be 10 seconds.
		// In case lock is older than 10 minutes, consider it stale and try to get a new lock.
		return {
			retryWait: 100,
			retries: 100,
			stale: 10 * 60 * 1000
		};
	}

	private getLockFilePath(lockFileName: string): string {
		const dirName = path.dirname(this.pathToEula);
		return path.join(dirName, lockFileName);
	}
}

$injector.register("nsCloudEulaService", EulaService);
