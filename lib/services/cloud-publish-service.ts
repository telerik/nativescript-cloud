import { DEFAULT_ANDROID_PUBLISH_TRACK } from "../constants";
import { basename } from "path";
import * as uuid from "uuid";
import { EOL } from "os";
import { CloudService } from "./cloud-service";
import { getProjectId } from "../helpers";

export class CloudPublishService extends CloudService implements ICloudPublishService {
	// Taken from: https://github.com/fastlane/fastlane/blob/master/fastlane_core/lib/fastlane_core/itunes_transporter.rb#L100
	private static ITMS_ERROR_REGEX = /\[Transporter Error Output\]:.*/g;
	private static GENERAL_ERROR_REGEX = /\[!\].*/g;
	protected silent = false;
	protected get failedError() {
		return "Publishing failed.";
	}

	protected get failedToStartError() {
		return "Failed to start publishing.";
	}

	constructor($errors: IErrors,
		$fs: IFileSystem,
		$httpClient: Server.IHttpClient,
		$logger: ILogger,
		$injector: IInjector,
		$nsCloudS3Service: IS3Service,
		$nsCloudOutputFilter: ICloudOutputFilter,
		$processService: IProcessService,
		private $nsCloudServerBuildService: IServerBuildService,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $nsCloudUploadService: IUploadService,
		private $projectDataService: IProjectDataService) {
		super($errors, $fs, $httpClient, $logger, $injector, $nsCloudS3Service, $nsCloudOutputFilter, $processService);
	}

	public getServerOperationOutputDirectory(options: IOutputDirectoryOptions): string {
		return "";
	}

	public async publishToItunesConnect(publishData: IItunesConnectPublishData): Promise<void> {
		const cloudOperationId = uuid.v4();
		this.validatePublishData(publishData);

		if (!publishData.credentials || !publishData.credentials.username || !publishData.credentials.password) {
			this.$errors.failWithoutHelp("Cannot perform publish - credentials are required.");
		}

		const projectData = this.$projectDataService.getProjectData(publishData.projectDir);
		const appIdentifier = getProjectId(projectData, this.$devicePlatformsConstants.iOS.toLowerCase());
		const publishRequestData: IPublishRequestData = {
			cloudOperationId,
			appIdentifier,
			credentials: publishData.credentials,
			packagePaths: publishData.packagePaths,
			platform: this.$devicePlatformsConstants.iOS
		};

		return this.publishCore(publishRequestData, publishData, this.getiOSError.bind(this));
	}

	public async publishToGooglePlay(publishData: IGooglePlayPublishData): Promise<void> {
		const cloudOperationId = uuid.v4();
		this.validatePublishData(publishData);

		if (!publishData.pathToAuthJson || !this.$fs.exists(publishData.pathToAuthJson)) {
			this.$errors.failWithoutHelp("Cannot perform publish - auth json file is not supplied or the provided path does not exist.");
		}

		let authJson: string;
		try {
			authJson = JSON.stringify(this.$fs.readJson(publishData.pathToAuthJson));
		} catch (ex) {
			this.$errors.failWithoutHelp("Cannot perform publish - auth json file is not in JSON format.");
		}

		publishData.track = publishData.track || DEFAULT_ANDROID_PUBLISH_TRACK;
		const projectData = this.$projectDataService.getProjectData(publishData.projectDir);
		const appIdentifier = getProjectId(projectData, this.$devicePlatformsConstants.Android.toLowerCase());
		return this.publishCore({
			cloudOperationId,
			appIdentifier,
			credentials: {
				authJson
			},
			packagePaths: publishData.packagePaths,
			platform: this.$devicePlatformsConstants.Android,
			track: publishData.track
		}, publishData, this.getAndroidError.bind(this));
	}

	private getiOSError(publishResult: ICloudOperationResult, publishRequestData: IPublishRequestData) {
		const itmsMessage = this.getFormattedError(publishResult.stdout, CloudPublishService.ITMS_ERROR_REGEX);
		const err = new Error(`${publishResult.errors}${EOL}${itmsMessage}${EOL}${publishResult.stderr}`);
		return err;
	}

	private getAndroidError(publishResult: ICloudOperationResult, publishRequestData: IPublishRequestData) {
		const generalMessage = this.getFormattedError(publishResult.stderr, CloudPublishService.GENERAL_ERROR_REGEX);
		return new Error(`${publishResult.errors}${EOL}${generalMessage}`);
	}

	private async publishCore(publishRequestData: IPublishRequestData, publishDataCore: IPublishDataCore, getError: (publishResult: ICloudOperationResult, publishRequestData: IPublishRequestData) => any): Promise<void> {
		publishRequestData.packagePaths = await this.getPreparePackagePaths(publishDataCore);
		publishRequestData.sharedCloud = publishDataCore.sharedCloud;

		this.$logger.info("Starting publishing.");
		const response = await this.$nsCloudServerBuildService.publish(publishRequestData);

		this.$logger.trace("Publish response", response);
		let publishResult: ICloudOperationResult;
		try {
			publishResult = await this.waitForServerOperationToFinish(publishRequestData.cloudOperationId, response);
		} catch (ex) {
			publishResult = this.getResult(publishRequestData.cloudOperationId);
			if (!publishResult) {
				throw ex;
			}

			this.$logger.trace("Publish failed with err: ", ex);
		}

		this.$logger.trace("Publish result:", publishResult);

		if (publishResult.code || publishResult.errors) {
			const err = getError(publishResult, publishRequestData);
			err.stderr = publishResult.stderr;
			err.stdout = publishResult.stdout;
			err.cloudOperationId = publishRequestData.cloudOperationId;
			throw err;
		}

		this.$logger.info("Publishing finished successfully.");
	}

	protected getServerResults(codesignResult: ICloudOperationResult): IServerItem[] {
		return [];
	}

	protected async getServerLogs(logsUrl: string, cloudOperationId: string): Promise<void> {
		// no specific implementation needed.
	}

	private async getPreparePackagePaths(publishData: IPackagePaths): Promise<string[]> {
		const preparedPackagePaths: string[] = [];
		for (const packagePath of publishData.packagePaths) {
			preparedPackagePaths.push(this.$fs.exists(packagePath) ? await this.$nsCloudUploadService.uploadToS3(packagePath, basename(packagePath)) : packagePath);
		}

		return preparedPackagePaths;
	}

	private validatePublishData(publishData: IPublishDataCore): void {
		if (!publishData.packagePaths || !publishData.packagePaths.length) {
			this.$errors.failWithoutHelp("Cannot upload without packages");
		}

		if (!publishData.projectDir) {
			this.$errors.failWithoutHelp("Cannot perform publish - projectDir is required.");
		}
	}

	private getFormattedError(message: string, regex: RegExp) {
		return _.uniq(message.match(regex)).join(EOL);
	}
}

$injector.register("nsCloudPublishService", CloudPublishService);
