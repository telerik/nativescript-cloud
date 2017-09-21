/**
 * Describes additional -- flags that can be passed to cloud commands.
 */
interface ICloudOptions extends IOptions {
	local: boolean;
	track: string;
}

/**
 * Describes provider used to leverage the additional -- flags.
 */
interface ICloudOptionsProvider {
	/**
	 * Used to get all dashed options from which -- flags are constructed.
	 */
	dashedOptions: IDictionary<IDashedOption>;
}