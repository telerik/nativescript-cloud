import { EventEmitter } from "events";

export class CloudEmulatorApplicationManager extends EventEmitter implements Mobile.IDeviceApplicationManager {

	constructor(private basicInfo: ICloudEmulatorDeviceBasicInfo,
		private $nsCloudServerEmulatorsService: IServerEmulatorsService) {
		super();
	}

	public async getInstalledApplications(): Promise<string[]> {
		return [];
	}

	public async installApplication(packageFilePath: string): Promise<void> {
		await this.$nsCloudServerEmulatorsService.deployApp(packageFilePath, this.basicInfo.os);
		return this.$nsCloudServerEmulatorsService.refereshEmulator(this.basicInfo.identifier);
	}

	public async isApplicationInstalled(appIdentifier: string): Promise<boolean> {
		return true;
	}

	public async uninstallApplication(appIdentifier: string): Promise<void> { /* currently empty */ }

	public async startApplication(appData: Mobile.IApplicationData): Promise<void> { /* currently empty */ }

	public async stopApplication(appData: Mobile.IApplicationData): Promise<void> { /* currently empty */ }

	public async getApplicationInfo(applicationIdentifier: string): Promise<Mobile.IApplicationInfo> {
		return null;
	}

	public canStartApplication(): boolean {
		return true;
	}

	public async isLiveSyncSupported(appIdentifier: string): Promise<boolean> {
		return false;
	}

	public async getDebuggableApps(): Promise<Mobile.IDeviceApplicationInformation[]> {
		return [];
	}

	public async getDebuggableAppViews(appIdentifiers: string[]): Promise<IDictionary<Mobile.IDebugWebViewInfo[]>> {
		return {};
	}

	public async reinstallApplication(appIdentifier: string, packageFilePath: string): Promise<void> {
		return this.installApplication(packageFilePath);
	}

	public async restartApplication(appData: Mobile.IApplicationData): Promise<void> { /* currently empty */ }

	public async checkForApplicationUpdates(): Promise<void> { /* currently empty */ }

	public async tryStartApplication(appData: Mobile.IApplicationData): Promise<void> { /* currently empty */ }
}
