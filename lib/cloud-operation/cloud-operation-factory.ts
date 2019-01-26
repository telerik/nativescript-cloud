export class CloudOperationFactory implements ICloudOperationFactory {
	constructor(private $injector: IInjector) { }

	public create(cloudOperationVersion: string, cloudOperationId: string, serverResponse: IServerResponse): ICloudOperation {
		const constructorArgs = { id: cloudOperationId, serverResponse: serverResponse };
		return this.$injector.resolve(require(`./cloud-operation-${cloudOperationVersion}`), constructorArgs);
	}
}

$injector.register("nsCloudOperationFactory", CloudOperationFactory);
