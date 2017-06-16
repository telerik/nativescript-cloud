import { CloudEmulatorApplicationManager } from "./cloud-emulator-application-manager";
import { CloudEmulatorDeviceFileSystem } from "./cloud-emulator-device-file-system";
import { DEVICE_INFO } from "../../constants";

export class CloudEmulatorDevice implements Mobile.IDevice {
	public applicationManager: Mobile.IDeviceApplicationManager;
	public fileSystem: Mobile.IDeviceFileSystem;
	public deviceInfo: Mobile.IDeviceInfo;

	constructor(private basicInfo: ICloudEmulatorDeviceBasicInfo,
		private $mobileHelper: Mobile.IMobileHelper,
		private $injector: IInjector) {
		this.init();
	}

	public get isEmulator(): boolean {
		return true;
	}

	public async openDeviceLogStream(): Promise<void> { /* currently empty */ }

	public getApplicationInfo(applicationIdentifier: string): Promise<Mobile.IApplicationInfo> {
		const deviceInfo: Mobile.IApplicationInfo = {
			applicationIdentifier: applicationIdentifier,
			deviceIdentifier: this.basicInfo.identifier,
			configuration: "debug"
		};

		return Promise.resolve(deviceInfo);
	}

	private init(): void {
		this.applicationManager = this.$injector.resolve(CloudEmulatorApplicationManager, { basicInfo: this.basicInfo });
		this.fileSystem = this.$injector.resolve(CloudEmulatorDeviceFileSystem);
		this.deviceInfo = {
			identifier: this.basicInfo.identifier,
			model: this.basicInfo.model,
			platform: this.$mobileHelper.normalizePlatformName(this.basicInfo.os),
			isTablet: false,
			displayName: this.basicInfo.model,
			version: "",
			vendor: DEVICE_INFO.VENDOR,
			type: DEVICE_INFO.TYPE,
			errorHelp: "",
			status: DEVICE_INFO.STATUS
		};
	}
}
