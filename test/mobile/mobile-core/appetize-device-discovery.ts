import { AppetizeDeviceDiscovery } from "../../../lib/mobile/mobile-core/appetize-device-discovery";
import { DEVICE_DISCOVERY_EVENTS } from "../../../lib/constants";
import { EventEmitter } from "events";
import { Yok } from "mobile-cli-lib/yok";
import { assert } from "chai";

class CustomDeviceEmitter extends EventEmitter implements CloudDeviceEmitter {
	private _initialDevices: IAttachedDevices;

	constructor(initialDevices?: IAttachedDevices) {
		super();
		this._initialDevices = initialDevices || {};
	}
	public getCurrentlyAttachedDevices(): IAttachedDevices {
		return this._initialDevices;
	}
	public dispose(): void { /* empty */ }
}

describe("appetize device discovery", () => {
	describe("startLookingForDevices", async () => {
		const customDevice = {
			identifier: "id",
			publicKey: "publicKey",
			model: "model",
			os: "os"
		};

		const initialDevices: IAttachedDevices = {
			id: customDevice
		};

		function createTestInjector(devices?: IAttachedDevices): IInjector {
			const customEventEmitter = new CustomDeviceEmitter(devices);
			const testInjector = new Yok();
			testInjector.register("injector", testInjector);
			testInjector.register("cloudDeviceEmulator", {
				get deviceEmitter() {
					return customEventEmitter;
				}
			});
			testInjector.register("cloudEmulatorService", { /* empty */ });
			testInjector.register("mobileHelper", {
				normalizePlatformName: (platform: string) => platform.toLowerCase()
			});

			return testInjector;
		}

		it(`should attach ${DEVICE_DISCOVERY_EVENTS.DEVICE_FOUND}/${DEVICE_DISCOVERY_EVENTS.DEVICE_LOST}`, async () => {
			const injector = createTestInjector();

			const appetizeDeviceDiscovery: Mobile.IDeviceDiscovery = injector.resolve(AppetizeDeviceDiscovery);
			await appetizeDeviceDiscovery.startLookingForDevices();

			const deviceEmitter = injector.resolve("cloudDeviceEmulator").deviceEmitter;

			assert.deepEqual(deviceEmitter.listenerCount(DEVICE_DISCOVERY_EVENTS.DEVICE_FOUND), 1);
			assert.deepEqual(deviceEmitter.listenerCount(DEVICE_DISCOVERY_EVENTS.DEVICE_LOST), 1);
		});

		it(`should not attach ${DEVICE_DISCOVERY_EVENTS.DEVICE_FOUND}/${DEVICE_DISCOVERY_EVENTS.DEVICE_LOST} multiple times upon multiple calls`, async () => {
			const injector = createTestInjector();

			const appetizeDeviceDiscovery: Mobile.IDeviceDiscovery = injector.resolve(AppetizeDeviceDiscovery);
			await appetizeDeviceDiscovery.startLookingForDevices();
			await appetizeDeviceDiscovery.startLookingForDevices();

			const deviceEmitter = injector.resolve("cloudDeviceEmulator").deviceEmitter;

			assert.deepEqual(deviceEmitter.listenerCount(DEVICE_DISCOVERY_EVENTS.DEVICE_FOUND), 1);
			assert.deepEqual(deviceEmitter.listenerCount(DEVICE_DISCOVERY_EVENTS.DEVICE_LOST), 1);
		});

		it("should detect already running devices", async () => {
			const injector = createTestInjector(initialDevices);
			let hasDetectedDevice = false;

			const appetizeDeviceDiscovery: Mobile.IDeviceDiscovery = injector.resolve(AppetizeDeviceDiscovery);
			appetizeDeviceDiscovery.on(DEVICE_DISCOVERY_EVENTS.DEVICE_FOUND, (device: Mobile.IDevice) => {
				hasDetectedDevice = true;
				assert.deepEqual(device.deviceInfo.identifier, customDevice.identifier);
				assert.deepEqual(device.deviceInfo.model, customDevice.model);
			});

			await appetizeDeviceDiscovery.startLookingForDevices();
			assert.isTrue(hasDetectedDevice);
		});

		it(`should detect devices on ${DEVICE_DISCOVERY_EVENTS.DEVICE_FOUND}`, async () => {
			const injector = createTestInjector();
			let hasDetectedDevice = false;

			const deviceEmitter: EventEmitter = injector.resolve("cloudDeviceEmulator").deviceEmitter;

			const appetizeDeviceDiscovery: Mobile.IDeviceDiscovery = injector.resolve(AppetizeDeviceDiscovery);
			appetizeDeviceDiscovery.on(DEVICE_DISCOVERY_EVENTS.DEVICE_FOUND, (device: Mobile.IDevice) => {
				hasDetectedDevice = true;
				assert.deepEqual(device.deviceInfo.identifier, customDevice.identifier);
				assert.deepEqual(device.deviceInfo.model, customDevice.model);
			});

			await appetizeDeviceDiscovery.startLookingForDevices();
			deviceEmitter.emit(DEVICE_DISCOVERY_EVENTS.DEVICE_FOUND, customDevice);
			assert.isTrue(hasDetectedDevice);
		});

		it(`should lose devices on ${DEVICE_DISCOVERY_EVENTS.DEVICE_LOST}`, async () => {
			const injector = createTestInjector(initialDevices);
			let hasLostDevice = false;

			const deviceEmitter: EventEmitter = injector.resolve("cloudDeviceEmulator").deviceEmitter;

			const appetizeDeviceDiscovery: Mobile.IDeviceDiscovery = injector.resolve(AppetizeDeviceDiscovery);
			appetizeDeviceDiscovery.on(DEVICE_DISCOVERY_EVENTS.DEVICE_LOST, (device: Mobile.IDevice) => {
				hasLostDevice = true;
				assert.deepEqual(device.deviceInfo.identifier, customDevice.identifier);
				assert.deepEqual(device.deviceInfo.model, customDevice.model);
			});

			await appetizeDeviceDiscovery.startLookingForDevices();
			deviceEmitter.emit(DEVICE_DISCOVERY_EVENTS.DEVICE_LOST, customDevice);

			assert.isTrue(hasLostDevice);
		});
	});
});
