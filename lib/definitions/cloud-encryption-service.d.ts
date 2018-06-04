interface ICloudEncryptionService {
	getWorkspacePassword(projectSettings: INSCloudProjectSettings): Promise<string>
}
