const bundleValidatorHelperName = "bundleValidatorHelper";

/**
 * Remove this class after CLI 4.0.0 - it exists for backwards compatibility only.
 */
export abstract class BundleValidatorBaseCommand {
	protected get $bundleValidatorHelper(): IBundleValidatorHelper {
		try {
			return this.$injector.resolve(bundleValidatorHelperName);
		} catch (e) {
			this.$logger.trace(`Unable to resolve ${bundleValidatorHelperName}, probably using and older version of CLI. Will default.`, e);
			return {
				validate: () => { /* Mock */ }
			};
		}
	}

	constructor(private $injector: IInjector,
		private $logger: ILogger) { }
}
