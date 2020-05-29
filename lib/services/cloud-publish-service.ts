import { basename } from "path";
import { EOL } from "os";
import { DEFAULT_ANDROID_PUBLISH_TRACK } from "../constants";
import { CloudService } from "./cloud-service";
import { getProjectId } from "../helpers";

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

	constructor($constants: IDictionary<any>,
		$nsCloudErrorsService: IErrors,
		$fs: IFileSystem,
		$httpClient: Server.IHttpClient,
		$logger: ILogger,
		$nsCloudOperationFactory: ICloudOperationFactory,
		$nsCloudOutputFilter: ICloudOutputFilter,
		$nsCloudProcessService: IProcessService,
		private $nsCloudServerBuildService: IServerBuildService,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $nsCloudUploadService: IUploadService,
		private $projectDataService: IProjectDataService) {
		super($nsCloudErrorsService, $fs, $httpClient, $logger, $constants, $nsCloudOperationFactory, $nsCloudOutputFilter, $nsCloudProcessService);
	}

	public async publishToItunesConnect(publishData: IItunesConnectPublishData): Promise<void> {
		(<INSCloudGlobal>global).showErrorForStoppedCloudBuilds();
		await this.executeCloudOperation("Cloud publish iOS", async (cloudOperationId: string): Promise<void> => {
			this.validatePublishData(publishData);

			const projectData = this.$projectDataService.getProjectData(publishData.projectDir);
			const appIdentifier = getProjectId(projectData, this.$devicePlatformsConstants.iOS.toLowerCase());

			const publishRequestData: IPublishRequestData = {
				cloudOperationId,
				appIdentifier,
				credentials: publishData.credentials,
				packagePaths: publishData.packagePaths,
				platform: this.$devicePlatformsConstants.iOS
			};

			await this.publishCore(publishRequestData, publishData, this.getiOSError.bind(this));
		});
	}

	public async publishToGooglePlay(publishData: IGooglePlayPublishData): Promise<void> {
		(<INSCloudGlobal>global).showErrorForStoppedCloudBuilds();
		await this.executeCloudOperation("Cloud publish Android", async (cloudOperationId: string): Promise<void> => {
			this.validatePublishData(publishData);

			if (!publishData.pathToAuthJson || !this.$fs.exists(publishData.pathToAuthJson)) {
				this.$nsCloudErrorsService.fail("Cannot perform publish - auth json file is not supplied or the provided path does not exist.");
			}

			let authJson: string;
			try {
				authJson = JSON.stringify(this.$fs.readJson(publishData.pathToAuthJson));
			} catch (ex) {
				this.$nsCloudErrorsService.fail("Cannot perform publish - auth json file is not in JSON format.");
			}

			publishData.track = publishData.track || DEFAULT_ANDROID_PUBLISH_TRACK;
			const projectData = this.$projectDataService.getProjectData(publishData.projectDir);
			const appIdentifier = getProjectId(projectData, this.$devicePlatformsConstants.Android.toLowerCase());
			await this.publishCore({
				cloudOperationId,
				appIdentifier,
				credentials: {
					authJson
				},
				packagePaths: publishData.packagePaths,
				platform: this.$devicePlatformsConstants.Android,
				track: publishData.track,
				androidReleaseStatus: publishData.androidReleaseStatus,
			}, publishData, this.getAndroidError.bind(this));
		});
	}

	private getiOSError(publishResult: ICloudOperationResult, publishRequestData: IPublishRequestData) {
		const itmsMessage = this.getFormattedError(publishResult, CloudPublishService.ITMS_ERROR_REGEX);
		const err = new Error(`${publishResult.errors}${EOL}${itmsMessage}`);
		return err;
	}

	private getAndroidError(publishResult: ICloudOperationResult, publishRequestData: IPublishRequestData) {
		const generalMessage = this.getFormattedError(publishResult, CloudPublishService.GENERAL_ERROR_REGEX);
		return new Error(`${publishResult.errors}${EOL}${generalMessage}`);
	}

	private async publishCore(publishRequestData: IPublishRequestData, publishDataCore: IPublishDataCore, getError: (publishResult: ICloudOperationResult, publishRequestData: IPublishRequestData) => any): Promise<void> {
		publishRequestData.packagePaths = await this.getPreparePackagePaths(publishDataCore);
		publishRequestData.sharedCloud = publishDataCore.sharedCloud;

		this.$logger.info("Starting publishing.");
		const response = await this.$nsCloudServerBuildService.publish(publishRequestData);

		this.$logger.trace("Publish response", response);
		const publishResult = await this.waitForCloudOperationToFinish(publishRequestData.cloudOperationId, response, { silent: true });

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

	private async getPreparePackagePaths(publishData: IPackagePaths): Promise<string[]> {
		const preparedPackagePaths: string[] = [];
		for (const packagePath of publishData.packagePaths) {
			preparedPackagePaths.push(this.$fs.exists(packagePath) ? await this.$nsCloudUploadService.uploadToS3(packagePath, basename(packagePath)) : packagePath);
		}

		return preparedPackagePaths;
	}

	private validatePublishData(publishData: IPublishDataCore): void {
		if (!publishData.packagePaths || !publishData.packagePaths.length) {
			this.$nsCloudErrorsService.fail("Cannot upload without packages");
		}

		if (!publishData.projectDir) {
			this.$nsCloudErrorsService.fail("Cannot perform publish - projectDir is required.");
		}
	}

	private getFormattedError(publishResult: ICloudOperationResult, regex: RegExp) {
		const log = publishResult.stdout || publishResult.stderr || "";
		return _.uniq(log.match(regex)).join(EOL);
	}
}

$injector.register("nsCloudPublishService", CloudPublishService);
