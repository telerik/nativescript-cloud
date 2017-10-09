export class CloudLibVersion implements ICommand {
	constructor(private $nsCloudPackageInfoService: IPackageInfoService,
		private $logger: ILogger) {
	}

	public allowedParameters: ICommandParameter[] = [];

	public async execute(args: string[]): Promise<void> {
		this.$logger.info(this.$nsCloudPackageInfoService.getVersion());
	}
}

$injector.registerCommand("cloud|lib|version", CloudLibVersion);
