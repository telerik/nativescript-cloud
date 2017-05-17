export class AppetizeEmulatorLauncher implements IAppetizeEmulatorLauncher {

	constructor(private $cloudEmulatorService: ICloudEmulatorService) { }

	public async startEmulator(data: IAppetizeEmulatorStartData): Promise<string> {
		const response: ICloudEmulatorResponse = await this.$cloudEmulatorService.deployApp(data.packageFile, data.platform);
		return this.$cloudEmulatorService.startEmulator(response.publicKey, data.platform, data.model);
	}
}

$injector.register("appetizeEmulatorLauncher", AppetizeEmulatorLauncher);
