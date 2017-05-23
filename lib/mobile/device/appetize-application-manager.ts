import { EventEmitter } from "events";

export class AppetizeApplicationManager extends EventEmitter implements Mobile.IDeviceApplicationManager {

	constructor(private basicInfo: IAppetizeDeviceBasicInfo,
		private $cloudEmulatorService: ICloudEmulatorService) {
		super();
	}

	public async getInstalledApplications(): Promise<string[]> {
		return [];
	}

	public async installApplication(packageFilePath: string): Promise<void> {
		await this.$cloudEmulatorService.deployApp(packageFilePath, this.basicInfo.os);
		return this.$cloudEmulatorService.refereshEmulator(this.basicInfo.identifier);
	}

	public async isApplicationInstalled(appIdentifier: string): Promise<boolean> {
		return true;
	}

	public async uninstallApplication(appIdentifier: string): Promise<void> { /* currently empty */ }

	public async startApplication(appIdentifier: string): Promise<void> { /* currently empty */ }

	public async stopApplication(appIdentifier: string): Promise<void> { /* currently empty */ }

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

	public async restartApplication(appIdentifier: string, appName?: string): Promise<void> { /* currently empty */ }

	public async checkForApplicationUpdates(): Promise<void> { /* currently empty */ }

	public async tryStartApplication(appIdentifier: string): Promise<void> { /* currently empty */ }
}
