declare interface ICloudBuildPropertiesService {
	validateBuildProperties(platform: string,
		buildConfiguration: string,
		appId: string,
		androidBuildData?: IAndroidBuildData,
		iOSBuildData?: IIOSBuildData): Promise<void>;

	getAndroidBuildProperties(projectSettings: INSCloudProjectSettings,
		buildProps: any,
		amazonStorageEntriesData: IAmazonStorageEntryData[],
		androidBuildData?: IAndroidBuildData): Promise<any>;

	getiOSBuildProperties(projectSettings: INSCloudProjectSettings,
		buildProps: any,
		amazonStorageEntriesData: IAmazonStorageEntryData[],
		iOSBuildData: IIOSBuildData): Promise<any>
}
