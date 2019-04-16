// TODO: Delete this once we do not support NativeScript CLI below 5.4.0
export class CloudProcessService implements IProcessService {
	protected get $nsCloudProcessService(): IProcessService {
		return this.$nsCloudPolyfillService.getPolyfillObject<IProcessService>("processService", {
			listenersCount: 0,
			attachToProcessExitSignals: (context: any, callback: () => void): void => { /* mock */ }
		});
	}

	constructor(private $nsCloudPolyfillService: IPolyfillService) { }

	public get listenersCount(): number {
		return this.$nsCloudProcessService.listenersCount;
	}

	public set listenersCount(value: number) {
		this.$nsCloudProcessService.listenersCount = value;
	}

	public attachToProcessExitSignals(context: any, callback: () => void): void {
		return this.$nsCloudProcessService.attachToProcessExitSignals(context, callback);
	}
}

$injector.register("nsCloudProcessService", CloudProcessService);
