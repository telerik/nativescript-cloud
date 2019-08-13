import * as constants from "./constants";

import * as forge from "node-forge";
import * as path from "path";
import * as minimatch from "minimatch";

const plist = require("simple-plist");

export class CloudBuildHelper implements ICloudBuildHelper {
	constructor(private $nsCloudErrorsService: IErrors,
		private $fs: IFileSystem,
		private $logger: ILogger) { }

	public getProvisionType(provisionData: IMobileProvisionData): string {
		let result = "";
		if (provisionData.Entitlements['get-task-allow']) {
			result = constants.PROVISION_TYPES.DEVELOPMENT;
		} else {
			result = constants.PROVISION_TYPES.ADHOC;
		}

		if (!provisionData.ProvisionedDevices || !provisionData.ProvisionedDevices.length) {
			if (provisionData.ProvisionsAllDevices) {
				result = constants.PROVISION_TYPES.ENTERPRISE;
			} else {
				result = constants.PROVISION_TYPES.APP_STORE;
			}
		}

		return result;
	}

	public getCertificateInfo(certificatePath: string, certificatePassword: string): ICertificateInfo {
		const certificateAbsolutePath = path.resolve(certificatePath);
		const certificateContents: any = this.$fs.readFile(certificateAbsolutePath, { encoding: 'binary' });
		const pkcs12Asn1 = forge.asn1.fromDer(certificateContents);
		const pkcs12 = forge.pkcs12.pkcs12FromAsn1(pkcs12Asn1, false, certificatePassword);

		for (let safeContens of pkcs12.safeContents) {
			for (let safeBag of safeContens.safeBags) {
				if (safeBag.attributes.localKeyId && safeBag.type === forge.pki.oids['certBag']) {
					let issuer = safeBag.cert.issuer.getField(constants.CRYPTO.ORGANIZATION_FIELD_NAME);
					return {
						pemCert: forge.pki.certificateToPem(safeBag.cert),
						organization: issuer && issuer.value,
						validity: safeBag.cert.validity,
						commonName: safeBag.cert.subject.getField(constants.CRYPTO.COMMON_NAME_FIELD_NAME).value,
						friendlyName: _.head<string>(safeBag.attributes.friendlyName)
					};
				}
			}
		}

		this.$nsCloudErrorsService.fail(`Could not read ${certificatePath}. Please make sure there is a certificate inside.`);
	}

	public isReleaseConfiguration(buildConfiguration: string): boolean {
		return buildConfiguration.toLowerCase() === constants.CLOUD_BUILD_CONFIGURATIONS.RELEASE.toLowerCase();
	}

	public getMobileProvisionData(provisionPath: string): IMobileProvisionData {
		const provisionText = this.$fs.readText(path.resolve(provisionPath));
		const provisionPlistText = provisionText.substring(provisionText.indexOf(constants.CRYPTO.PLIST_HEADER), provisionText.indexOf(constants.CRYPTO.PLIST_FOOTER) + constants.CRYPTO.PLIST_FOOTER.length);
		return plist.parse(provisionPlistText);
	}

	public async zipProject(projectDir: string): Promise<string> {
		let tempDir = path.join(projectDir, constants.CLOUD_TEMP_DIR_NAME);
		this.$fs.ensureDirectoryExists(tempDir);

		let projectZipFile = path.join(tempDir, "Build.zip");
		this.$fs.deleteFile(projectZipFile);

		let files = this.getProjectFiles(projectDir, ["node_modules", "platforms", constants.CLOUD_TEMP_DIR_NAME, "**/.*"]);

		await this.$fs.zipFiles(projectZipFile, files, p => this.getProjectRelativePath(p, projectDir));

		return projectZipFile;
	}

	private getProjectFiles(projectFilesPath: string, excludedProjectDirsAndFiles?: string[], filter?: (filePath: string, stat: IFsStats) => boolean, opts?: any): string[] {
		const projectFiles = this.$fs.enumerateFilesInDirectorySync(projectFilesPath, (filePath, stat) => {
			const isFileExcluded = this.isFileExcluded(path.relative(projectFilesPath, filePath), excludedProjectDirsAndFiles);
			const isFileFiltered = filter ? filter(filePath, stat) : false;
			return !isFileExcluded && !isFileFiltered;
		}, opts);

		this.$logger.trace("getProjectFiles for cloud build: ", projectFiles);

		return projectFiles;
	}

	private isFileExcluded(filePath: string, excludedProjectDirsAndFiles?: string[]): boolean {
		return !!_.find(excludedProjectDirsAndFiles, (pattern) => minimatch(filePath, pattern, { nocase: true }));
	}

	private getProjectRelativePath(fullPath: string, projectDir: string): string {
		projectDir = path.join(projectDir, path.sep);
		if (!_.startsWith(fullPath, projectDir)) {
			throw new Error("File is not part of the project.");
		}

		return fullPath.substring(projectDir.length);
	}
}

$injector.register("nsCloudBuildHelper", CloudBuildHelper);
