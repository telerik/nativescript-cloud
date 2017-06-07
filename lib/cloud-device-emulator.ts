export class CloudDeviceEmulatorWrapper implements ICloudDeviceEmulator {
	private cloudDeviceEmulatorInstance: ICloudDeviceEmulator;

	public get deviceEmitter(): CloudDeviceEmitter {
		return this.cloudDeviceEmulatorInstance.deviceEmitter;
	}

	constructor(private $options: IOptions,
		private $processService: IProcessService) {
		this.cloudDeviceEmulatorInstance = require("cloud-device-emulator");
		this.$processService.attachToProcessExitSignals(this, this._dispose);
	}

	public getSeverAddress(): Promise<ICloudDeviceServerInfo> {
		return this.cloudDeviceEmulatorInstance.getSeverAddress();
	}

	public refresh(deviceIdentifier: string): Promise<void> {
		return this.cloudDeviceEmulatorInstance.refresh(deviceIdentifier);
	}

	public killServer(): Promise<any> {
		return this.cloudDeviceEmulatorInstance.killServer();
	}

	public dispose() {
		if (!this.$options.watch) {
			this._dispose();
		}
	}

	private _dispose() {
		this.cloudDeviceEmulatorInstance.deviceEmitter.dispose();
	}
}

$injector.register("cloudDeviceEmulator", CloudDeviceEmulatorWrapper);
