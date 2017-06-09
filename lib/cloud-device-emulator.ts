export class CloudDeviceEmulatorWrapper implements ICloudDeviceEmulator {
	private _isCloudDeviceEmulatorInstanceInitialized = false;
	private get cloudDeviceEmulatorInstance(): ICloudDeviceEmulator {
		this._isCloudDeviceEmulatorInstanceInitialized = true;
		return require("cloud-device-emulator");
	}

	public get deviceEmitter(): CloudDeviceEmitter {
		return this.cloudDeviceEmulatorInstance.deviceEmitter;
	}

	constructor(private $options: IOptions,
		private $usbLiveSyncService: any,
		private $processService: IProcessService) {
		this.$processService.attachToProcessExitSignals(this, this._dispose);
	}

	public getSeverAddress(): Promise<ICloudDeviceServerInfo> {
		return this.cloudDeviceEmulatorInstance.getSeverAddress();
	}

	public refresh(deviceIdentifier: string): Promise<void> {
		return this.cloudDeviceEmulatorInstance.refresh(deviceIdentifier);
	}

	public async killServer(): Promise<any> {
		if (this._isCloudDeviceEmulatorInstanceInitialized) {
			return this.cloudDeviceEmulatorInstance.killServer();
		}
	}

	public dispose() {
		if (!this.$options.watch || !this.$usbLiveSyncService.isInitialized) {
			this._dispose();
		}
	}

	private _dispose() {
		if (this._isCloudDeviceEmulatorInstanceInitialized) {
			this.cloudDeviceEmulatorInstance.deviceEmitter.dispose();
		}
	}
}

$injector.register("cloudDeviceEmulator", CloudDeviceEmulatorWrapper);
