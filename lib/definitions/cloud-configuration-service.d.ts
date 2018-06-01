/**
 * Describes service used to configure cloud operations.
 */
interface ICloudConfigurationService {
	/**
	 * Retrieves information about cloud configuration. If no information available will return null.
	 */
	getCloudConfigurationData(): ICloudConfigurationData;
}


/**
 * Describes interface for configuring cloud operations.
 */
interface ICloudConfigurationData extends IOptionalMachineId {
	/**
	 * Determines the version of the {N} CLI that will be used to build the project in the cloud.
	 */
	tnsCliCloudVersion?: string;
}

/**
 * Describes helper interface containing a machine identificator.
 */
interface IOptionalMachineId {
	/**
	 * Determines on which machine the cloud build should be performed.
	 */
	machineId?: string;
}