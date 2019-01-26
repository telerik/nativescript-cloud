export class CloudOperationFactory implements ICloudOperationFactory {
	constructor(private $injector: IInjector,
		private $logger: ILogger) { }

	public create(cloudOperationVersion: string, cloudOperationId: string, serverResponse: IServerResponse): ICloudOperation {
		const constructorArgs = { id: cloudOperationId, serverResponse: serverResponse };
		let cloudOperationConstructor;
		try {
			cloudOperationConstructor = require(`./cloud-operation-${cloudOperationVersion}`);
		} catch (err) {
			this.$logger.trace(err);
			throw new Error(`Invalid cloud operation version: ${cloudOperationVersion}`);
		}

		return this.$injector.resolve(cloudOperationConstructor, constructorArgs);
	}
}

$injector.register("nsCloudOperationFactory", CloudOperationFactory);
