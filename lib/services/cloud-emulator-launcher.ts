export class CloudEmulatorLauncher implements ICloudEmulatorLauncher {

	constructor(private $cloudEmulatorService: ICloudEmulatorService) { }

	public async startEmulator(data: ICloudEmulatorStartData): Promise<string> {
		const response: ICloudEmulatorResponse = await this.$cloudEmulatorService.deployApp(data.packageFile, data.platform);
		return this.$cloudEmulatorService.startEmulator(response.publicKey, data.platform, data.model);
	}
}

$injector.register("cloudEmulatorLauncher", CloudEmulatorLauncher);
