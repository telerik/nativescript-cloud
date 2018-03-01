export class CloudEmulatorDeviceFileSystem implements Mobile.IDeviceFileSystem {
	public async listFiles(devicePath: string, appIdentifier?: string): Promise<any> { /* currently empty */ }

	public async getFile(deviceFilePath: string, appIdentifier: string, outputPath?: string): Promise<void> { /* currently empty */ }

	public async putFile(localFilePath: string, deviceFilePath: string, appIdentifier: string): Promise<void> { /* currently empty */ }

	public async transferFiles(deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[]): Promise<Mobile.ILocalToDevicePathData[]> { return []; }

	public async transferDirectory(deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[], projectFilesPath: string): Promise<Mobile.ILocalToDevicePathData[]> { return []; }

	public async transferFile(localPath: string, devicePath: string): Promise<void> { /* currently empty */ }

	public async createFileOnDevice(deviceFilePath: string, fileContent: string): Promise<void> { /* currently empty */ }
}
