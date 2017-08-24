import * as path from "path";
import * as uuid from "uuid";
import * as constants from "../constants";
import { CloudService } from "./cloud-service";

export class CloudCodesignService extends CloudService implements ICloudCodesignService {
	private platform = this.$devicePlatformsConstants.iOS;

	protected failedError: string;
	protected failedToStartError: string;
	protected operationInProgressStatus: string;

	constructor($fs: IFileSystem,
		$httpClient: Server.IHttpClient,
		$logger: ILogger,
		private $buildCloudService: IBuildCloudService,
		private $errors: IErrors,
		private $devicesService: Mobile.IDevicesService,
		private $projectHelper: IProjectHelper,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants) {
		super($fs, $httpClient, $logger);
		this.failedToStartError = "Failed to start cloud codesign generation.";
		this.failedError = "Codesign generation failed.";
		this.operationInProgressStatus = "Working";
	}

	public async generateCodesignFiles(codesignData: ICodesignData,
		projectData: IProjectData): Promise<ICodesignResultData> {
		codesignData.clean = codesignData.clean === undefined ? true : codesignData.clean;
		const buildId = uuid.v4();

		try {
			const serverResult = await this.executeGeneration(codesignData, projectData, buildId);
			return serverResult;
		} catch (err) {
			err.buildId = buildId;
			throw err;
		}
	}

	public getServerOperationOutputDirectory(options: ICloudServerOutputDirectoryOptions): string {
		return path.join(options.projectDir, constants.CODESIGN_TEMP_DIR_NAME, options.platform.toLowerCase());
	}

	protected getServerResults(codesignResult: IServerResult): IServerItem[] {
		const result = _.filter(codesignResult.buildItems, b => b.disposition === constants.DISPOSITIONS.CERTIFICATE
			|| b.disposition === constants.DISPOSITIONS.PROVISION);

		if (!result) {
			this.$errors.failWithoutHelp(
				`No item with disposition ${constants.DISPOSITIONS.CERTIFICATE} or ${constants.DISPOSITIONS.PROVISION} found in the server result items.`);
		}

		return result;
	}

	protected async getServerLogs(logsUrl: string, buildId: string): Promise<void> {
		// no specific implementation needed.
	}

	public async executeGeneration(codesignData: ICodesignData,
		projectData: IProjectData,
		buildId: string): Promise<ICodesignResultData> {
		const codesignInformationString = "Generation of iOS certificate and provision files";
		this.$logger.info(`Starting ${codesignInformationString}.`);

		const codesignRequest = await this.prepareCodesignRequest(buildId, codesignData, projectData);
		const codesignResponse: IServerResponse = await this.$buildCloudService.generateCodesignFiles(codesignRequest);
		this.$logger.trace(`Codesign response: ${JSON.stringify(codesignResponse)}`);

		let codesignResult: IServerResult;
		try {
			await this.waitForServerOperationToFinish(buildId, codesignResponse);
		} catch (ex) {
			this.$logger.trace("Codesign generation failed with err: ", ex);
		} finally {
			codesignResult = await this.getObjectFromS3File<IServerResult>(codesignResponse.resultUrl);
		}

		this.$logger.trace("Codesign result:");
		this.$logger.trace(codesignResult);

		if (!codesignResult.buildItems || !codesignResult.buildItems.length) {
			// Something failed.
			this.$errors.failWithoutHelp(`Codesign failed. Reason is: ${codesignResult.errors}. Additional information: ${codesignResult.stderr}.`);
		}

		this.$logger.info(`Finished ${codesignInformationString} successfully. Downloading result...`);

		const localCodesignResults = await this.downloadServerResults(codesignResult, {
			projectDir: projectData.projectDir,
			platform: this.platform,
			emulator: false
		});

		this.$logger.info(`The result of ${codesignInformationString} successfully downloaded. Codesign files paths: ${localCodesignResults}`);

		const fullOutput = await this.getContentOfS3File(codesignResponse.resultUrl);

		const result = {
			buildId,
			stderr: codesignResult.stderr,
			stdout: codesignResult.stdout,
			fullOutput: fullOutput,
			outputFilesPaths: localCodesignResults
		};

		return result;
	}

	private async prepareCodesignRequest(buildId: string,
		codesignData: ICodesignData,
		projectData: IProjectData): Promise<any> {

		const sanitizedProjectName = this.$projectHelper.sanitizeName(projectData.projectName);
		await this.$devicesService.detectCurrentlyAttachedDevices({ shouldReturnImmediateResult: false, platform: this.platform });
		let attachedDevices = this.$devicesService.getDeviceInstances();
		attachedDevices = attachedDevices.filter(d => d.deviceInfo.platform.toLowerCase() === this.platform.toLowerCase());
		const devices = attachedDevices.map(d => ({ displayName: d.deviceInfo.displayName, identifier: d.deviceInfo.identifier }));

		return {
			buildId,
			appId: projectData.projectId,
			appName: sanitizedProjectName,
			clean: codesignData.clean,
			username: codesignData.username,
			password: codesignData.password,
			devices: devices
		};
	}
}

$injector.register("cloudCodesignService", CloudCodesignService);
