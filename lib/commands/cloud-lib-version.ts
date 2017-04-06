export class CloudLibVersion implements ICommand {
	constructor(private $packageInfoService: IPackageInfoService,
		private $logger: ILogger) {
	}

	public allowedParameters: ICommandParameter[] = [];

	public async execute(args: string[]): Promise<void> {
		this.$logger.info(this.$packageInfoService.getVersion());
	}
}

$injector.registerCommand("cloud|lib|version", CloudLibVersion);
