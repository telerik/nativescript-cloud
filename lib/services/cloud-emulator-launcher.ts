export class CloudEmulatorLauncher implements ICloudEmulatorLauncher {

	constructor(private $nsCloudEmulatorService: ICloudEmulatorService) { }

	public async startEmulator(data: ICloudEmulatorStartData): Promise<string> {
		const response: ICloudEmulatorResponse = await this.$nsCloudEmulatorService.deployApp(data.packageFile, data.platform);
		return this.$nsCloudEmulatorService.startEmulator(response.publicKey, data.platform, data.model);
	}
}

$injector.register("nsCloudEmulatorLauncher", CloudEmulatorLauncher);
