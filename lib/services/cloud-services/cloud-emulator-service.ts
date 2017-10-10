import * as path from "path";

import { EMULATORS_SERVICE_NAME, HTTP_METHODS } from "../../constants";
import { CloudServiceBase } from "./cloud-service-base";

export class CloudEmulatorService extends CloudServiceBase implements ICloudEmulatorService {

	protected serviceName = EMULATORS_SERVICE_NAME;

	constructor(private $nsCloudDeviceEmulator: ICloudDeviceEmulator,
		protected $nsCloudRequestService: ICloudRequestService,
		private $nsCloudUploadService: IUploadService,
		private $fs: IFileSystem,
		protected $options: IProfileDir) {

		super($nsCloudRequestService);
	}

	public async startEmulator(publicKey: string, platform: string, deviceType: string): Promise<string> {
		const serverInfo = await this.$nsCloudDeviceEmulator.getSeverAddress();
		return `http://${serverInfo.host}:${serverInfo.port}?publicKey=${publicKey}&device=${deviceType}`;
	}

	public async deployApp(fileLocation: string, platform: string): Promise<ICloudEmulatorResponse> {
		if (this.$fs.exists(path.resolve(fileLocation))) {
			fileLocation = await this.$nsCloudUploadService.uploadToS3(fileLocation);
		}

		const cloudEmulatorKeys = this.getEmulatorCredentials(platform);
		if (!cloudEmulatorKeys) {
			return this.createApp(fileLocation, platform);
		}

		return this.updateApp(fileLocation, platform, cloudEmulatorKeys.publicKey, cloudEmulatorKeys.privateKey);
	}

	public refereshEmulator(deviceIdentifier: string): Promise<void> {
		return this.$nsCloudDeviceEmulator.refresh(deviceIdentifier);
	}

	private async createApp(url: string, platform: string): Promise<ICloudEmulatorResponse> {
		const response = await this.sendRequest<ICloudEmulatorResponse>(HTTP_METHODS.POST, "api/apps", { url, platform });
		this.setEmulatorCredentials(response.publicKey, response.privateKey, response.platform);
		return response;
	}

	private updateApp(url: string, platform: string, publicKey: string, privateKey: string): Promise<ICloudEmulatorResponse> {
		return this.sendRequest<ICloudEmulatorResponse>(HTTP_METHODS.PUT, `api/apps/${publicKey}`, { url, platform });
	}

	private setEmulatorCredentials(publicKey: string, privateKey: string, platform: string): void {
		const configPath = this.getCredentialsPath();
		let emulatorCredential = this.loadCredentials();
		emulatorCredential[platform] = { publicKey, privateKey };
		this.$fs.writeJson(configPath, emulatorCredential);
	}

	private getEmulatorCredentials(platform: string): ICloudEmulatorKeys {
		return this.loadCredentials()[platform];
	}

	private loadCredentials(): IEmulatorCredentials {
		const configFileName = this.getCredentialsPath();
		return this.$fs.exists(configFileName) ? this.$fs.readJson(configFileName) : {};
	}

	private getCredentialsPath(): string {
		return path.join(this.$options.profileDir, "cloud-emulator.json");
	}
}

$injector.register("nsCloudEmulatorService", CloudEmulatorService);
