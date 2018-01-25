import { join } from "path";
import * as semver from "semver";

export class VersionService implements IVersionService {
	private static DEFAULT_CLI_VERSION = "3.0.0";

	constructor(private $fs: IFileSystem,
		private $httpClient: Server.IHttpClient,
		private $logger: ILogger) { }

	public async getCliVersion(runtimeVersion: string): Promise<string> {
		try {
			const latestMatchingVersion = process.env.TNS_CLI_CLOUD_VERSION || await this.getLatestMatchingVersion("nativescript", this.getVersionRangeWithTilde(runtimeVersion));
			return latestMatchingVersion || VersionService.DEFAULT_CLI_VERSION;
		} catch (err) {
			this.$logger.trace(`Unable to get information about CLI versions. Error is: ${err.message}`);
			return `${semver.major(runtimeVersion)}.${semver.minor(runtimeVersion)}.0`;
		}
	}

	public async getRuntimeVersion(platform: string, nativescriptData: any, coreModulesVersion: string): Promise<string> {
		const runtimePackageName = `tns-${platform.toLowerCase()}`;
		let runtimeVersion = nativescriptData && nativescriptData[runtimePackageName] && nativescriptData[runtimePackageName].version;
		if (!runtimeVersion && coreModulesVersion) {
			// no runtime added. Let's find out which one we need based on the tns-core-modules.
			if (semver.valid(coreModulesVersion)) {
				runtimeVersion = await this.getLatestMatchingVersion(runtimePackageName, this.getVersionRangeWithTilde(coreModulesVersion));
			} else if (semver.validRange(coreModulesVersion)) {
				// In case tns-core-modules in package.json are referred as `~x.x.x` - this is not a valid version, but is valid range.
				runtimeVersion = await this.getLatestMatchingVersion(runtimePackageName, coreModulesVersion);
			}
		}

		return runtimeVersion || VersionService.DEFAULT_CLI_VERSION;
	}

	public getCoreModulesVersion(projectDir: string): string {
		// HACK just for this version. After that we'll have UI for getting runtime version.
		// Until then, use the coreModulesVersion.
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
			const response = await this.$httpClient.httpRequest(`http://registry.npmjs.org/${packageName}`);
			const versions = _.keys(JSON.parse(response.body).versions);
			return versions;
		} catch (err) {
			this.$logger.trace(`Unable to get versions of ${packageName} from npm. Error is: ${err.message}.`);
			return [];
		}
	}

	private getVersionRangeWithTilde(versionString: string): string {
		return `~${semver.major(versionString)}.${semver.minor(versionString)}.0`;
	}
}

$injector.register("nsCloudVersionService", VersionService);
