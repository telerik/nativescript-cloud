import { EventEmitter } from "events";
import { DEVICE_DISCOVERY_EVENTS } from "../../constants";
import { deviceEmitter } from "cloud-device-emulator";
import { AppetizeDevice } from "../device/appetize-device";
import { values } from "lodash";

export class AppetizeDeviceDiscovery extends EventEmitter implements Mobile.IDeviceDiscovery {
	private devices: IDictionary<Mobile.IDevice> = {};

	constructor(private $injector: IInjector) {
		super();
	}

	public addDevice(device: Mobile.IDevice) {
		this.devices[device.deviceInfo.identifier] = device;
		this.raiseOnDeviceFound(device);
	}

	public removeDevice(deviceIdentifier: string) {
		let device = this.devices[deviceIdentifier];
		if (!device) {
			return;
		}

		delete this.devices[deviceIdentifier];
		this.raiseOnDeviceLost(device);
	}

	public async startLookingForDevices(): Promise<void> {
		values(deviceEmitter.getCurrentlyAttachedDevices()).forEach(basicInfo => {
			this.addAppetizeDevice(basicInfo);
		});

		deviceEmitter.on(DEVICE_DISCOVERY_EVENTS.DEVICE_FOUND, (basicInfo: IAppetizeDeviceBasicInfo) => {
			this.addAppetizeDevice(basicInfo);
		});

		deviceEmitter.on(DEVICE_DISCOVERY_EVENTS.DEVICE_LOST, (basicInfo: IAppetizeDeviceBasicInfo) => {
			const device: Mobile.IDevice = this.$injector.resolve(AppetizeDevice, { basicInfo: basicInfo });
			this.removeDevice(device.deviceInfo.identifier);
		});
	}

	public async checkForDevices(): Promise<void> { /* currently empty */ }

	private raiseOnDeviceFound(device: Mobile.IDevice) {
		this.emit(DEVICE_DISCOVERY_EVENTS.DEVICE_FOUND, device);
	}

	private raiseOnDeviceLost(device: Mobile.IDevice) {
		this.emit(DEVICE_DISCOVERY_EVENTS.DEVICE_LOST, device);
	}

	private addAppetizeDevice(basicInfo: IAppetizeDeviceBasicInfo) {
		const device: Mobile.IDevice = this.$injector.resolve(AppetizeDevice, { basicInfo: basicInfo });
		this.addDevice(device);
	}
}

$injector.register("appetizeDeviceDiscovery", AppetizeDeviceDiscovery);
