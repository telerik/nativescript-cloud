import { join } from "path";
import * as semver from "semver";

export class VersionService implements IVersionService {
	constructor(private $fs: IFileSystem,
		private $httpClient: Server.IHttpClient,
		private $logger: ILogger,
		private $projectDataService: IProjectDataService) { }

	public async getCliVersion(runtimeVersion: string): Promise<string> {
		try {
			const latestMatchingVersion = process.env.TNS_CLI_CLOUD_VERSION || await this.getLatestMatchingVersion("nativescript", this.getVersionRangeWithTilde(runtimeVersion));
			if (!latestMatchingVersion) {
				throw new Error(`Cannot find matching CLI version based on runtime version ${runtimeVersion}`);
			}

			return latestMatchingVersion;
		} catch (err) {
			this.$logger.trace(`Unable to get information about CLI versions. Error is: ${err.message}`);
			if (!semver.valid(runtimeVersion)) {
				// In case the runtime version is not a valid semver version, we cannot determine CLI version.
				throw new Error("Unable to determine CLI version for cloud build.");
			}

			return `${semver.major(runtimeVersion)}.${semver.minor(runtimeVersion)}.0`;
		}
	}

	public async getProjectRuntimeVersion(projectDir: string, platform: string, ): Promise<string> {
		const runtimePackageName = `tns-${platform.toLowerCase()}`;
		const runtimeVersion = this.$projectDataService.getNSValue(projectDir, `${runtimePackageName}.version`);

		if (!runtimeVersion) {
			throw new Error(`Unable to find runtime version for package ${runtimePackageName}.`);
		}

		return runtimeVersion;
	}

	public getCoreModulesVersion(projectDir: string): string {
		return this.$fs.readJson(join(projectDir, "package.json")).dependencies["tns-core-modules"];
	}

	private async getLatestMatchingVersion(packageName: string, range: string): Promise<string> {
		const versions = await this.getVersionsFromNpm(packageName);
		if (versions.length) {
			return semver.maxSatisfying(versions, range);
		}

		return null;
	}

	private async getVersionsFromNpm(packageName: string): Promise<string[]> {
		try {
			const packageData = await this.getPackageDataFromNpm(packageName);
			return _.keys(packageData.versions);
		} catch (err) {
			this.$logger.trace(`Unable to get versions of ${packageName} from npm. Error is: ${err.message}.`);
			return [];
		}
	}

	private async getPackageDataFromNpm(packageName: string): Promise<IDictionary<any>> {
		const response = await this.$httpClient.httpRequest(`http://registry.npmjs.org/${packageName}`);
		return JSON.parse(response.body);
	}

	private getVersionRangeWithTilde(versionString: string): string {
		return `~${semver.major(versionString)}.${semver.minor(versionString)}.0`;
	}
}

$injector.register("nsCloudVersionService", VersionService);
