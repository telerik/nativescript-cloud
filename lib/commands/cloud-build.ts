import { BundleValidatorBaseCommand } from "./bundle-validator-base-command";

export class CloudBuildCommand extends BundleValidatorBaseCommand implements ICommand {
	public allowedParameters: ICommandParameter[];

	public get dashedOptions() {
		return this.$nsCloudOptionsProvider.dashedOptions;
	}

	constructor($nsCloudPolyfillService: IPolyfillService,
		private $nsCloudEulaCommandHelper: IEulaCommandHelper,
		private $errors: IErrors,
		private $nsCloudBuildCommandHelper: IBuildCommandHelper,
		private $nsCloudBuildService: ICloudBuildService,
		private $nsCloudOptionsProvider: ICloudOptionsProvider,
		private $options: ICloudOptions,
		private $projectData: IProjectData,
		private $androidBundleValidatorHelper: IAndroidBundleValidatorHelper) {
		super($nsCloudPolyfillService);
		this.$projectData.initializeProjectData();
	}

	public async execute(args: string[]): Promise<void> {
		const buildData = this.$nsCloudBuildCommandHelper.getCloudBuildData(args[0]);
		await this.$nsCloudBuildService.build(buildData.projectSettings,
			buildData.platform, buildData.buildConfiguration,
			this.$options.accountId,
			buildData.androidBuildData,
			buildData.iOSBuildData);
	}

	public async canExecute(args: string[]): Promise<boolean> {
		this.$bundleValidatorHelper.validate();
		await this.$nsCloudEulaCommandHelper.ensureEulaIsAccepted();
		this.$androidBundleValidatorHelper.validateNoAab();

		if (!args || !args.length) {
			this.$errors.fail("Provide platform.");
		}

		if (args.length > 1) {
			this.$errors.fail("Only a single platform is supported.");
		}

		return true;
	}
}

$injector.registerCommand(["build|cloud", "cloud|build"], CloudBuildCommand);
