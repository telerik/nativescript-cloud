export class CloudAndroidBundleValidatorHelper implements IAndroidBundleValidatorHelper {
	protected get $bundleValidatorHelper(): IAndroidBundleValidatorHelper {
		return this.$nsCloudPolyfillService.getPolyfillObject<IAndroidBundleValidatorHelper>("androidBundleValidatorHelper", {
			validateNoAab: () => { /* Mock */ },
			validateRuntimeVersion: () => { /* Mock */ }
		});
	}

	constructor(private $nsCloudPolyfillService: IPolyfillService) { }

	validateNoAab() {
		return this.$bundleValidatorHelper.validateNoAab();
	}

	validateRuntimeVersion(projectData: IProjectData) {
		return this.$bundleValidatorHelper.validateRuntimeVersion(projectData);
	}
}

$injector.register("nsCloudAndroidBundleValidatorHelper", CloudAndroidBundleValidatorHelper);
