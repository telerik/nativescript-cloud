/**
 * Remove this class after CLI 4.0.0 - it exists for backwards compatibility only.
 */
export abstract class BundleValidatorBaseCommand {
	protected get $bundleValidatorHelper(): IBundleValidatorHelper {
		return this.$nsCloudPolyfillService.getPolyfillObject<IBundleValidatorHelper>("bundleValidatorHelper", {
			validate: () => { /* Mock */ }
		});
	}

	constructor(private $nsCloudPolyfillService: IPolyfillService) { }
}
