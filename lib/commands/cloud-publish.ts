import { DEFAULT_ANDROID_PUBLISH_TRACK, ERROR_MESSAGES } from "../constants";
import { isInteractive } from "../helpers";

abstract class CloudPublish implements ICommand {
	public allowedParameters: ICommandParameter[];
	public get dashedOptions() {
		return this.$cloudOptionsProvider.dashedOptions;
	}

	constructor(private $cloudOptionsProvider: ICloudOptionsProvider,
		protected $prompter: IPrompter,
		protected $projectData: IProjectData,
		protected $options: ICloudOptions,
		protected $devicePlatformsConstants: Mobile.IDevicePlatformsConstants) {
		this.$projectData.initializeProjectData();
	}

	public abstract execute(args: string[]): Promise<void>;
	public abstract canExecute(args: string[]): Promise<boolean>;
}

export class CloudPublishAndroid extends CloudPublish implements ICommand {
	constructor($cloudOptionsProvider: ICloudOptionsProvider,
		private $buildCommandHelper: IBuildCommandHelper,
		private $cloudPublishService: ICloudPublishService,
		private $errors: IErrors,
		protected $prompter: IPrompter,
		protected $projectData: IProjectData,
		protected $options: ICloudOptions,
		protected $devicePlatformsConstants: Mobile.IDevicePlatformsConstants) {
		super($cloudOptionsProvider, $prompter, $projectData, $options, $devicePlatformsConstants);
	}

	public async execute(args: string[]): Promise<void> {
		let pathToAuthJson = args[0];
		let track = this.$options.track;

		if (!pathToAuthJson) {
			pathToAuthJson = await this.$prompter.getString("Path to auth JSON", { allowEmpty: false });
		}

		if (!track) {
			track = await this.$prompter.getString("Track", { defaultAction: () => DEFAULT_ANDROID_PUBLISH_TRACK });
		}

		const packagePath = await this.$buildCommandHelper.buildForPublishingPlatform(this.$devicePlatformsConstants.Android);
		return this.$cloudPublishService.publishToGooglePlay({
			track,
			pathToAuthJson,
			packagePaths: [packagePath],
			projectDir: this.$projectData.projectDir,
		});
	}

	public async canExecute(args: string[]): Promise<boolean> {
		if (args.length > 1 || (!isInteractive() && args.length < 1)) {
			this.$errors.fail("The command accepts only one parameter - Path to authentication JSON");
		}

		return true;
	}
}

$injector.registerCommand("cloud|publish|android", CloudPublishAndroid);

export class CloudPublishIos extends CloudPublish implements ICommand {
	constructor($cloudOptionsProvider: ICloudOptionsProvider,
		private $buildCommandHelper: IBuildCommandHelper,
		private $cloudPublishService: ICloudPublishService,
		private $errors: IErrors,
		protected $prompter: IPrompter,
		protected $projectData: IProjectData,
		protected $options: ICloudOptions,
		protected $devicePlatformsConstants: Mobile.IDevicePlatformsConstants) {
		super($cloudOptionsProvider, $prompter, $projectData, $options, $devicePlatformsConstants);
	}

	public async execute(args: string[]): Promise<void> {
		const credentials = await this.$buildCommandHelper.getAppleCredentials(args);
		const packagePath = await this.$buildCommandHelper.buildForPublishingPlatform(this.$devicePlatformsConstants.iOS);
		const itunesPublishdata: IItunesConnectPublishData = {
			credentials,
			packagePaths: [packagePath],
			projectDir: this.$projectData.projectDir,
			teamId: this.$options.teamId
		};

		try {
			await this.$cloudPublishService.publishToItunesConnect(itunesPublishdata);
		} catch (err) {
			if (err.teamNames && isInteractive()) {
				const teamId = await this.$prompter.promptForChoice("Multiple teams found on iTunes Connect, please choose one", err.teamNames);
				itunesPublishdata.teamId = teamId;
				itunesPublishdata.packagePaths = err.packagePaths || itunesPublishdata.packagePaths;
				return this.$cloudPublishService.publishToItunesConnect(itunesPublishdata);
			}

			throw err;
		}
	}

	public async canExecute(args: string[]): Promise<boolean> {
		if (args.length > 2 || (!isInteractive() && args.length < 1)) {
			this.$errors.fail(ERROR_MESSAGES.COMMAND_REQUIRES_APPLE_USERNAME_PASS);
		}

		return true;
	}
}

$injector.registerCommand("cloud|publish|ios", CloudPublishIos);
