interface ICloudPlatformsData {
	getPlatformData(platform: string, projectData: IProjectData): IPlatformData;
}