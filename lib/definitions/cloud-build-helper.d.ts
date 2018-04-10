declare interface ICloudBuildHelper {
	getProvisionType(provisionData: IMobileProvisionData): string;
	getCertificateInfo(certificatePath: string, certificatePassword: string): ICertificateInfo;
	isReleaseConfiguration(buildConfiguration: string): boolean;
	getMobileProvisionData(provisionPath: string): IMobileProvisionData;
	zipProject(projectDir: string): Promise<string>;
}
