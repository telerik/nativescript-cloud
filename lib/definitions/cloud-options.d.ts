/**
 * Describes additional -- flags that can be passed to cloud commands.
 */
interface ICloudOptions extends IOptions, ISharedCloud {
	accountId: string;
	apiVersion: string;
	local: boolean;
	serverProto: string;
	namespace: string;
	instanceId: string;
	track: string;
	workflow: IWorkflowPropertyOptions;
	vmTemplateName: string;
	appleSessionBase64: string;
	appleApplicationSpecificPassword: string;
}

/**
 * Describes options that can be passed via the workflow flag.
 */
interface IWorkflowPropertyOptions {
	/**
	 * Used to specify the url where the actual workflow can be found.
	 */
	url?: string;

	/**
	 * Used to specify the workflow's name.
	 */
	name?: string;
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
