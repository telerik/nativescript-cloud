export class KillServer implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor(private $cloudDeviceEmulator: ICloudDeviceEmulator,
		private $logger: ILogger) { }

	public async execute(args: string[]): Promise<void> {
		this.$logger.info("Killing server");
		await this.$cloudDeviceEmulator.killServer();
	}
}

$injector.registerCommand("kill-server", KillServer);
