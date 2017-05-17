import * as path from "path";

import { getSeverAddress, refresh } from "cloud-device-emulator";
import { EMULATORS_SERVICE_NAME } from "../../constants";
import { CloudServiceBase } from "./cloud-service-base";

export class CloudEmulatorService extends CloudServiceBase implements ICloudEmulatorService {

	protected serviceName = EMULATORS_SERVICE_NAME;

	constructor(protected $cloudRequestService: ICloudRequestService,
		private $uploadService: IUploadService,
		private $fs: IFileSystem,
		protected $options: IProfileDir) {

		super($cloudRequestService);
	}

	public async startEmulator(publicKey: string, platform: string, deviceType: string): Promise<string> {
		const serverInfo = await getSeverAddress();
		return `http://${serverInfo.host}:${serverInfo.port}?publicKey=${publicKey}&device=${deviceType}`;
	}

	public async deployApp(url: string, platform: string): Promise<ICloudEmulatorResponse> {
		if (this.$fs.exists(path.resolve(url))) {
			url = await this.$uploadService.updloadToS3(url);
		}

		const appetizeKeys = this.getEmulatorCredentials(platform);
		if (!appetizeKeys) {
			return this.createApp(url, platform);
		}

		return this.updateApp(url, platform, appetizeKeys.publicKey, appetizeKeys.privateKey);
	}

	public async createApp(url: string, platform: string): Promise<ICloudEmulatorResponse> {
		const response = await this.sendRequest<ICloudEmulatorResponse>("POST", "api/apps", { url, platform });
		this.setEmulatorCredentials(response.publicKey, response.privateKey, response.platform);
		return response;
	}

	public updateApp(url: string, platform: string, publicKey: string, privateKey: string): Promise<ICloudEmulatorResponse> {
		return this.sendRequest<ICloudEmulatorResponse>("PUT", `api/apps/${publicKey}`, { url, platform });
	}

	public refereshEmulator(deviceIdentifier: string): Promise<void> {
		return refresh(deviceIdentifier);
	}

	private setEmulatorCredentials(publicKey: string, privateKey: string, platform: string): void {
		const configPath = this.getCredentialsPath();
		let emulatorCredential = this.loadCredentials();
		emulatorCredential[platform] = { publicKey, privateKey };
		this.$fs.writeJson(configPath, emulatorCredential);
	}

	private getEmulatorCredentials(platform: string): ICloudEmulatorKeys {
		return <ICloudEmulatorKeys>this.loadCredentials()[platform];
	}

	private loadCredentials(): any {
		const configFileName = this.getCredentialsPath();
		return this.$fs.exists(configFileName) ? this.$fs.readJson(configFileName) : {};
	}

	private getCredentialsPath(): string {
		return path.join(this.$options.profileDir, "cloud-emulator.json");
	}
}

$injector.register("cloudEmulatorService", CloudEmulatorService);
