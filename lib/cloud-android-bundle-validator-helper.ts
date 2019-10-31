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
		return this.$bundleValidatorHelper.validateDeviceApiLevel(device, buildData);
	}
}

$injector.register("nsCloudAndroidBundleValidatorHelper", CloudAndroidBundleValidatorHelper);
