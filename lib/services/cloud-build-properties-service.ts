import * as constants from "../constants";

import { EOL } from "os";

export class CloudBuildPropertiesService implements ICloudBuildPropertiesService {
	constructor(private $nsCloudBuildHelper: ICloudBuildHelper,
		private $errors: IErrors,
		private $fs: IFileSystem,
		private $mobileHelper: Mobile.IMobileHelper) { }

	public async validateBuildProperties(platform: string,
		buildConfiguration: string,
		appId: string,
		androidBuildData?: IAndroidBuildData,
		iOSBuildData?: IIOSBuildData): Promise<void> {
		if (this.$mobileHelper.isAndroidPlatform(platform) && this.$nsCloudBuildHelper.isReleaseConfiguration(buildConfiguration)) {
			if (!androidBuildData || !androidBuildData.pathToCertificate) {
				this.$errors.failWithoutHelp("When building for Release configuration, you must specify valid Certificate and its password.");
			}

			if (!this.$fs.exists(androidBuildData.pathToCertificate)) {
				this.$errors.failWithoutHelp(`The specified certificate: ${androidBuildData.pathToCertificate} does not exist. Verify the location is correct.`);
			}

			if (!androidBuildData.certificatePassword) {
				this.$errors.failWithoutHelp(`No password specified for certificate ${androidBuildData.pathToCertificate}.`);
			}

			if (androidBuildData.certificatePassword.length < 6) {
				this.$errors.failWithoutHelp("The password for Android certificate must be at least 6 characters long.");
			}
		} else if (this.$mobileHelper.isiOSPlatform(platform) && iOSBuildData.buildForDevice) {
			if (!iOSBuildData || !iOSBuildData.pathToCertificate || !iOSBuildData.certificatePassword || !iOSBuildData.pathToProvision) {
				this.$errors.failWithoutHelp("When building for iOS you must specify valid Mobile Provision, Certificate and its password.");
			}

			if (!this.$fs.exists(iOSBuildData.pathToCertificate)) {
				this.$errors.failWithoutHelp(`The specified certificate: ${iOSBuildData.pathToCertificate} does not exist. Verify the location is correct.`);
			}

			if (!this.$fs.exists(iOSBuildData.pathToProvision)) {
				this.$errors.failWithoutHelp(`The specified provision: ${iOSBuildData.pathToProvision} does not exist. Verify the location is correct.`);
			}

			const certInfo = this.$nsCloudBuildHelper.getCertificateInfo(iOSBuildData.pathToCertificate, iOSBuildData.certificatePassword);
			const certBase64 = this.getCertificateBase64(certInfo.pemCert);
			const provisionData = this.$nsCloudBuildHelper.getMobileProvisionData(iOSBuildData.pathToProvision);
			const provisionCertificatesBase64 = _.map(provisionData.DeveloperCertificates, c => c.toString('base64'));
			const now = Date.now();

			let provisionAppId = provisionData.Entitlements['application-identifier'];
			_.each(provisionData.ApplicationIdentifierPrefix, prefix => {
				provisionAppId = provisionAppId.replace(`${prefix}.`, "");
			});

			let errors: string[] = [];

			if (provisionAppId !== "*") {
				let provisionIdentifierPattern = new RegExp(this.getRegexPattern(provisionAppId));
				if (!provisionIdentifierPattern.test(appId)) {
					errors.push(`The specified provision's (${iOSBuildData.pathToProvision}) application identifier (${provisionAppId}) doesn't match your project's application identifier (${appId}).`);
				}
			}

			if (certInfo.organization !== constants.APPLE_INC) {
				errors.push(`The specified certificate: ${iOSBuildData.pathToCertificate} is issued by an untrusted organization. Please provide a certificate issued by ${constants.APPLE_INC}`);
			}

			if (now > provisionData.ExpirationDate.getTime()) {
				errors.push(`The specified provision: ${iOSBuildData.pathToProvision} has expired.`);
			}

			if (now < certInfo.validity.notBefore.getTime() || now > certInfo.validity.notAfter.getTime()) {
				errors.push(`The specified certificate: ${iOSBuildData.pathToCertificate} has expired.`);
			}

			if (!_.includes(provisionCertificatesBase64, certBase64)) {
				errors.push(`The specified provision: ${iOSBuildData.pathToProvision} does not include the specified certificate: ${iOSBuildData.pathToCertificate}. Please specify a different provision or certificate.`);
			}

			if (iOSBuildData.deviceIdentifier && !_.includes(provisionData.ProvisionedDevices, iOSBuildData.deviceIdentifier)) {
				errors.push(`The specified provision: ${iOSBuildData.pathToProvision} does not include the specified device: ${iOSBuildData.deviceIdentifier}.`);
			}

			if (errors.length) {
				this.$errors.failWithoutHelp(errors.join(EOL));
			}
		}
	}

	public async getAndroidBuildProperties(projectSettings: INSCloudProjectSettings,
		buildProps: any,
		amazonStorageEntriesData: IAmazonStorageEntryData[],
		androidBuildData?: IAndroidBuildData): Promise<any> {

		const buildConfiguration = buildProps.properties.buildConfiguration;

		if (this.$nsCloudBuildHelper.isReleaseConfiguration(buildConfiguration)) {
			const certificateData = _.find(amazonStorageEntriesData, amazonStorageEntryData => amazonStorageEntryData.filePath === androidBuildData.pathToCertificate);
			buildProps.properties.keyStoreName = certificateData.fileName;
			buildProps.properties.keyStoreAlias = this.$nsCloudBuildHelper.getCertificateInfo(androidBuildData.pathToCertificate, androidBuildData.certificatePassword).friendlyName;
			buildProps.properties.keyStorePassword = androidBuildData.certificatePassword;
			buildProps.properties.keyStoreAliasPassword = androidBuildData.certificatePassword;

			buildProps.buildFiles.push({
				disposition: certificateData.disposition,
				sourceUri: certificateData.publicDownloadUrl
			});
		}

		return buildProps;
	}

	public async getiOSBuildProperties(projectSettings: INSCloudProjectSettings,
		buildProps: any,
		amazonStorageEntriesData: IAmazonStorageEntryData[],
		iOSBuildData: IIOSBuildData): Promise<any> {

		if (iOSBuildData.buildForDevice) {
			const provisionData = this.$nsCloudBuildHelper.getMobileProvisionData(iOSBuildData.pathToProvision);
			const certificateData = _.find(amazonStorageEntriesData, amazonStorageEntryData => amazonStorageEntryData.filePath === iOSBuildData.pathToCertificate);
			const provisonData = _.find(amazonStorageEntriesData, amazonStorageEntryData => amazonStorageEntryData.filePath === iOSBuildData.pathToProvision);

			buildProps.buildFiles.push(
				{
					sourceUri: certificateData.publicDownloadUrl,
					disposition: certificateData.disposition
				},
				{
					sourceUri: provisonData.publicDownloadUrl,
					disposition: provisonData.disposition
				}
			);

			buildProps.properties.certificatePassword = iOSBuildData.certificatePassword;
			buildProps.properties.codeSigningIdentity = this.$nsCloudBuildHelper.getCertificateInfo(iOSBuildData.pathToCertificate, iOSBuildData.certificatePassword).commonName;

			const cloudProvisionsData: any[] = [{
				suffixId: "",
				templateName: "PROVISION_",
				identifier: provisionData.UUID,
				isDefault: true,
				fileName: provisonData.fileName,
				appGroups: [],
				provisionType: this.$nsCloudBuildHelper.getProvisionType(provisionData),
				name: provisionData.Name
			}];
			buildProps.properties.mobileProvisionIdentifiers = JSON.stringify(cloudProvisionsData);
			buildProps.properties.defaultMobileProvisionIdentifier = provisionData.UUID;
		} else {
			buildProps.properties.simulator = true;
		}

		return buildProps;
	}

	private getCertificateBase64(cert: string) {
		return cert.replace(/\s/g, "").substr(constants.CRYPTO.CERTIFICATE_HEADER.length).slice(0, -constants.CRYPTO.CERTIFICATE_FOOTER.length);
	}

	private getRegexPattern(appIdentifier: string): string {
		let starPlaceholder = "<!StarPlaceholder!>";
		let escapedIdentifier = this.escape(this.stringReplaceAll(appIdentifier, "*", starPlaceholder));
		let replacedIdentifier = this.stringReplaceAll(escapedIdentifier, starPlaceholder, ".*");
		return "^" + replacedIdentifier + "$";
	}

	private escape(s: string): string {
		return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
	}

	private stringReplaceAll(inputString: string, find: any, replace: string): string {
		return inputString.split(find).join(replace);
	}
}

$injector.register("nsCloudBuildPropertiesService", CloudBuildPropertiesService);
