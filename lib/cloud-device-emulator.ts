export class CloudDeviceEmulatorWrapper implements ICloudDeviceEmulator {
	private cloudDeviceEmulatorInstance: ICloudDeviceEmulator;

	public get deviceEmitter(): CloudDeviceEmitter {
		return this.cloudDeviceEmulatorInstance.deviceEmitter;
	}

	constructor() {
		this.cloudDeviceEmulatorInstance = require("cloud-device-emulator");
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
}

$injector.register("cloudDeviceEmulator", CloudDeviceEmulatorWrapper);
