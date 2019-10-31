export class CloudAndroidBundleValidatorHelper implements IAndroidBundleValidatorHelper {
	protected get $bundleValidatorHelper(): IAndroidBundleValidatorHelper {
		return this.$nsCloudPolyfillService.getPolyfillObject<IAndroidBundleValidatorHelper>("androidBundleValidatorHelper", {
			validateNoAab: () => { /* Mock */ },
			validateRuntimeVersion: () => { /* Mock */ },
			validateDeviceApiLevel: () => { /* Mock */ }
		});
	}

	constructor(private $nsCloudPolyfillService: IPolyfillService) { }

	validateNoAab() {
		return this.$bundleValidatorHelper.validateNoAab();
	}

	validateRuntimeVersion(projectData: IProjectData) {
		return this.$bundleValidatorHelper.validateRuntimeVersion(projectData);
	}

	validateDeviceApiLevel(device: Mobile.IDevice, buildData: IBuildData): void {
		throw new Error("validateDeviceApiLevel method is not implemented.");
	}
}

$injector.register("nsCloudAndroidBundleValidatorHelper", CloudAndroidBundleValidatorHelper);
