interface ICloudPlatformService {
	shouldBuild(config: IApplicationBuildConfig, projectData: IProjectData): Promise<boolean>;
	shouldInstall(config: IApplicationInstallConfig, projectData: IProjectData, device: Mobile.IDevice): Promise<boolean>;
	deployPlatform(platform: string, outputDirectoryPath: string): Promise<void>;
	saveBuildInfoFile(projectDir: string, buildInfoFileDirname: string, platformData: IPlatformData): Promise<void>;
	preparePlatform(projectSettings: INSCloudProjectSettings,
		platform: string,
		buildConfiguration: string,
		projectData: IProjectData,
		provision: string,
		mobileProvisionData: any): Promise<void>;
}