import * as temp from "temp";

export class CloudTempService implements ITempService {
	private tempService: ITempService;

	constructor(private $logger: ILogger,
		private $injector: IInjector) {
		try {
			const tempService = this.$injector.resolve<ITempService>("tempService");
			this.tempService = tempService;
		} catch (err) {
			this.$logger.trace("Unable to resolve tempService in nativescript-cloud. Will use basic temp module");
			temp.track();
		}
	}

	public async mkdirSync(affixes: string): Promise<string> {
		if (this.tempService) {
			return this.tempService.mkdirSync(affixes);
		}

		return temp.mkdirSync(affixes);
	}

	public async path(options: ITempPathOptions): Promise<string> {
		if (this.tempService) {
			return this.tempService.path(options);
		}

		return temp.path(options);
	}
}

$injector.register("nsCloudTempService", CloudTempService);
