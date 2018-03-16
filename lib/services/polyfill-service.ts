export class PolyfillService implements IPolyfillService {
	constructor(private $logger: ILogger,
		private $injector: IInjector) { }

	public getPolyfillObject<T>(dependencyName: string, polyfill: any): T {
		try {
			return this.$injector.resolve(dependencyName);
		} catch (e) {
			this.$logger.trace(`Unable to resolve ${dependencyName}, probably using and older version of CLI. Will default.`, e);
			return polyfill;
		}
	}
}

$injector.register("nsCloudPolyfillService", PolyfillService);
