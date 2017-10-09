export class KillServer implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor(private $nsCloudDeviceEmulator: ICloudDeviceEmulator,
		private $logger: ILogger) { }

	public async execute(args: string[]): Promise<void> {
		this.$logger.info("Killing server");
		await this.$nsCloudDeviceEmulator.killServer();
	}
}

$injector.registerCommand("kill-server", KillServer);
