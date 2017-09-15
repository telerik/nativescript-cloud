import { isInteractive } from "../helpers";
import { ERROR_MESSAGES } from "../constants";

export class CloudCodesignCommand implements ICommand {
	// Currently only iOS codesign generation is supported.
	private readonly platform = this.$devicePlatformsConstants.iOS;
	private devices: Mobile.IDeviceInfo[];
	public allowedParameters: ICommandParameter[];

	constructor(private $logger: ILogger,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $devicesService: Mobile.IDevicesService,
		private $errors: IErrors,
		private $projectData: IProjectData,
		private $prompter: IPrompter,
		private $cloudCodesignService: ICloudCodesignService) {
		this.$projectData.initializeProjectData();
	}

	public async execute(args: string[]): Promise<void> {
		let username = args[0];
		let password = args[1];

		if (!username) {
			username = await this.$prompter.getString("Apple ID", { allowEmpty: false });
		}

		if (!password) {
			password = await this.$prompter.getPassword("Apple ID password");
		}

		this.$logger.info("Generating codesign files in the cloud");

		const codesignData = {
			username, password,
			clean: true,
			platform: this.platform,
			attachedDevices: this.devices
		};

		await this.$cloudCodesignService.generateCodesignFiles(codesignData, this.$projectData.projectDir);
	}

	public async canExecute(args: string[]): Promise<boolean> {
		if (args.length > 2 || (!isInteractive() && args.length < 2)) {
			this.$errors.fail(ERROR_MESSAGES.COMMAND_REQUIRES_APPLE_USERNAME_PASS);
		}

		await this.$devicesService.detectCurrentlyAttachedDevices({ shouldReturnImmediateResult: false, platform: this.platform });
		this.devices = this.$devicesService.getDeviceInstances()
			.filter(d => !d.isEmulator && d.deviceInfo.platform.toLowerCase() === this.platform.toLowerCase())
			.map(d => d.deviceInfo);
		if (!this.devices || this.devices.length === 0) {
			this.$errors.fail("Please attach iOS devices for which to generate codesign files.");
		}

		return true;
	}
}

$injector.registerCommand("codesign|cloud", CloudCodesignCommand);
