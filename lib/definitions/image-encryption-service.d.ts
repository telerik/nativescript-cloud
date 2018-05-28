interface IImageEncryptionService {
	getImagePassword(projectSettings: INSCloudProjectSettings): Promise<string>
}
