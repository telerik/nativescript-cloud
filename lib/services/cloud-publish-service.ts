import { DEFAULT_ANDROID_PUBLISH_TRACK } from "../constants";
import { basename } from "path";
import * as uuid from "uuid";
import { EOL } from "os";
import { CloudService } from "./cloud-service";

export class CloudPublishService extends CloudService implements ICloudPublishService {
	// Taken from: https://github.com/fastlane/fastlane/blob/master/fastlane_core/lib/fastlane_core/itunes_transporter.rb#L100
	private static ITMS_ERROR_REGEX = /\[Transporter Error Output\]:.*/g;
	private static GENERAL_ERROR_REGEX = /\[!\].*/g;

	protected get failedError() {
		return "Publishing failed.";
	}

	protected get failedToStartError() {
		return "Failed to start publishing.";
	}

	constructor($fs: IFileSystem,
		$httpClient: Server.IHttpClient,
		$logger: ILogger,
		private $errors: IErrors,
		private $nsCloudServerBuildService: IServerBuildService,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $nsCloudUploadService: IUploadService,
		private $projectDataService: IProjectDataService) {
		super($fs, $httpClient, $logger);
	}

	public getServerOperationOutputDirectory(options: IOutputDirectoryOptions): string {
		return "";
	}

	public async publishToItunesConnect(publishData: IItunesConnectPublishData): Promise<void> {
		this.validatePublishData(publishData);

		if (!publishData.credentials || !publishData.credentials.username || !publishData.credentials.password) {
			this.$errors.failWithoutHelp("Cannot perform publish - credentials are required.");
		}

		const appIdentifier = this.$projectDataService.getProjectData(publishData.projectDir).projectId;
		const publishRequestData = {
			appIdentifier,
			credentials: publishData.credentials,
			packagePaths: publishData.packagePaths,
			platform: this.$devicePlatformsConstants.iOS
		};

		return this.publishCore(publishRequestData, publishData, this.getiOSError.bind(this));
	}

	public async publishToGooglePlay(publishData: IGooglePlayPublishData): Promise<void> {
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
		const appIdentifier = this.$projectDataService.getProjectData(publishData.projectDir).projectId;
		return this.publishCore({
			appIdentifier,
			credentials: {
				authJson
			},
			packagePaths: publishData.packagePaths,
			platform: this.$devicePlatformsConstants.Android,
			track: publishData.track
		}, publishData, this.getAndroidError.bind(this));
	}

	private getiOSError(publishResult: IBuildServerResult, publishRequestData: IPublishRequestData) {
		const itmsMessage = this.getFormattedError(publishResult.stdout, CloudPublishService.ITMS_ERROR_REGEX);
		const err = new Error(`${publishResult.errors}${EOL}${itmsMessage}${EOL}${publishResult.stderr}`);
		return err;
	}

	private getAndroidError(publishResult: IBuildServerResult, publishRequestData: IPublishRequestData) {
		const generalMessage = this.getFormattedError(publishResult.stderr, CloudPublishService.GENERAL_ERROR_REGEX);
		return new Error(`${publishResult.errors}${EOL}${generalMessage}`);
	}

	private async publishCore(publishRequestData: IPublishRequestData, publishDataCore: IPublishDataCore, getError: (publishResult: IBuildServerResult, publishRequestData: IPublishRequestData) => any): Promise<void> {
		publishRequestData.packagePaths = await this.getPreparePackagePaths(publishDataCore);
		publishRequestData.sharedCloud = publishDataCore.sharedCloud;

		this.$logger.info("Starting publishing.");
		const response = await this.$nsCloudServerBuildService.publish(publishRequestData);

		this.$logger.trace("Publish response", response);
		const buildId = uuid.v4();
		try {
			await this.waitForServerOperationToFinish(buildId, response);
		} catch (ex) {
			this.$logger.trace("Publish failed with err: ", ex);
		}

		const publishResult = await this.getObjectFromS3File<IBuildServerResult>(response.resultUrl);
		this.$logger.trace("Publish result:", publishResult);

		if (publishResult.code || publishResult.errors) {
			const err = getError(publishResult, publishRequestData);
			err.stderr = publishResult.stderr;
			err.stdout = publishResult.stdout;
			throw err;
		}

		this.$logger.info("Publishing finished successfully.");
	}

	protected getServerResults(codesignResult: IBuildServerResult): IServerItem[] {
		return [];
	}

	protected async getServerLogs(logsUrl: string, buildId: string): Promise<void> {
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
