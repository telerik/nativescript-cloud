import * as path from "path";
import * as uuid from "uuid";
import * as constants from "../constants";
import { CloudService } from "./cloud-service";

export class CloudCodesignService extends CloudService implements ICloudCodesignService {

	protected get failedError() {
		return "Generation of codesign files failed.";
	}

	protected get failedToStartError() {
		return "Failed to start generation of codesign files.";
	}

	constructor($fs: IFileSystem,
		$httpClient: Server.IHttpClient,
		$logger: ILogger,
		private $buildCloudService: IBuildCloudService,
		private $errors: IErrors,
		private $projectHelper: IProjectHelper,
		private $projectDataService: IProjectDataService,
	) {
		super($fs, $httpClient, $logger);
	}

	public async generateCodesignFiles(codesignData: ICodesignData,
		projectDir: string): Promise<ICodesignResultData> {
		this.validateParameteres(codesignData, projectDir);
		codesignData.clean = codesignData.clean === undefined ? true : codesignData.clean;
		const buildId = uuid.v4();

		try {
			const serverResult = await this.executeGeneration(codesignData, projectDir, buildId);
			return serverResult;
		} catch (err) {
			err.buildId = buildId;
			throw err;
		}
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

	public getServerOperationOutputDirectory(options: ICloudServerOutputDirectoryOptions): string {
		return path.join(options.projectDir, constants.CODESIGN_FILES_DIR_NAME, options.platform.toLowerCase());
	}

	private validateParameteres(codesignData: ICodesignData,
		projectDir: string) : void {
		if (!codesignData || !codesignData.username || !codesignData.password) {
			this.$errors.failWithoutHelp(`Codesign failed. Reason is missing code sign data. Apple Id and Apple Id password are required..`);
		}

		if (!projectDir) {
			this.$errors.failWithoutHelp(`Codesign failed. Reason is invalid project path.`);
		}
	}

	private async executeGeneration(codesignData: ICodesignData,
		projectDir: string,
		buildId: string): Promise<ICodesignResultData> {
		const codesignInformationString = "generation of iOS certificate and provision files";
		this.$logger.info(`Starting ${codesignInformationString}.`);

		const projectData = this.$projectDataService.getProjectData(projectDir);
		const codesignRequest = await this.prepareCodesignRequest(buildId, codesignData, projectData);
		const codesignResponse: IServerResponse = await this.$buildCloudService.generateCodesignFiles(codesignRequest);
		this.$logger.trace(`Codesign response: ${JSON.stringify(codesignResponse)}`);

		try {
			await this.waitForServerOperationToFinish(buildId, codesignResponse);
		} catch (ex) {
			this.$logger.trace("Codesign generation failed with err: ", ex);
		}

		const codesignResult = await this.getObjectFromS3File<IServerResult>(codesignResponse.resultUrl);
		this.$logger.trace("Codesign result:");
		this.$logger.trace(codesignResult);

		if (!codesignResult.buildItems || !codesignResult.buildItems.length) {
			// Something failed.
			const err: any = new Error(`Codesign failed. Reason is: ${codesignResult.errors}.`);
			err.stderr = codesignResult.stderr;
			throw err;
		}

		this.$logger.info(`Finished ${codesignInformationString} successfully. Downloading result...`);

		const localCodesignResults = await this.downloadServerResults(codesignResult, {
			projectDir: projectData.projectDir,
			platform: codesignData.platform,
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

	protected async getServerLogs(logsUrl: string, buildId: string): Promise<void> {
		// no specific implementation needed.
	}

	private async prepareCodesignRequest(buildId: string,
		codesignData: ICodesignData,
		projectData: IProjectData): Promise<any> {

		const sanitizedProjectName = this.$projectHelper.sanitizeName(projectData.projectName);
		return {
			buildId,
			appId: projectData.projectId,
			appName: sanitizedProjectName,
			clean: codesignData.clean,
			username: codesignData.username,
			password: codesignData.password,
			devices: codesignData.attachedDevices
		};
	}
}

$injector.register("cloudCodesignService", CloudCodesignService);
