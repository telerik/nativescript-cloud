export class CloudEmulatorLauncher implements ICloudEmulatorLauncher {

	constructor(private $nsCloudServerEmulatorsService: IServerEmulatorsService) { }

	public async startEmulator(data: ICloudEmulatorStartData): Promise<string> {
		const response: ICloudEmulatorResponse = await this.$nsCloudServerEmulatorsService.deployApp(data.packageFile, data.platform);
		return this.$nsCloudServerEmulatorsService.startEmulator(response.publicKey, data.platform, data.model);
	}
}

$injector.register("nsCloudEmulatorLauncher", CloudEmulatorLauncher);
