import * as semver from "semver";

export class VersionService implements IVersionService {
	constructor(private $httpClient: Server.IHttpClient,
		private $logger: ILogger,
		private $projectDataService: IProjectDataService) { }

	public async getCliVersion(runtimeVersion: string): Promise<string> {
		try {
			const latestMatchingVersion = process.env.TNS_CLI_CLOUD_VERSION || await this.getLatestMatchingVersion("nativescript", runtimeVersion);
			if (!latestMatchingVersion) {
				throw new Error("Cannot find CLI versions.");
			}

			return latestMatchingVersion;
		} catch (err) {
			throw new Error(`Unable to determine CLI version for cloud build based on project's runtime version: ${runtimeVersion}. Error is: ${err.message}`);
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

	private async getLatestMatchingVersion(packageName: string, dependentPackageName: string): Promise<string> {
		const patchRange = this.getVersionRangeWithTilde({
			versionString: dependentPackageName,
			shouldRespectPatchVersion: true
		});

		const generalRange = this.getVersionRangeWithTilde({
			versionString: dependentPackageName
		});
		const versions = await this.getVersionsFromNpm(packageName);
		if (versions.length) {
			return semver.maxSatisfying(versions, patchRange) || semver.maxSatisfying(versions, generalRange);
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

	private getVersionRangeWithTilde(versionRangeOptions: IVersionRangeOptions): string {
		const prerelease = semver.prerelease(versionRangeOptions.versionString);
		// Append -0 if dealing with a prerelease in order to get the latest prerelease available
		const prereleaseString = prerelease ? "-0" : "";
		const major = semver.major(versionRangeOptions.versionString);
		const minor = semver.minor(versionRangeOptions.versionString);
		const patch = versionRangeOptions.shouldRespectPatchVersion ? semver.patch(versionRangeOptions.versionString) : "0";
		return `~${major}.${minor}.${patch}${prereleaseString}`;
	}
}

$injector.register("nsCloudVersionService", VersionService);
