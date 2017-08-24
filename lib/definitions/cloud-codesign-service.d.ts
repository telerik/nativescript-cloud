/**
 * Describes the result of a cloud codesign operation (i.e. generation of codesign files for iOS builds).
 */
interface ICodesignResultData extends IServerResultData {
	/**
	 * Path to the downloaded results of the codesign generation - .p12, .mobileprovision
	 */
	outputFilesPaths: string[];
}

/**
 *  Describes specific data required for codesigning files to be generated.
 */
interface ICodesignData extends ICredentials {
	/**
	 * Whether to revoke and reissue certificate even if it is not expired. This option is necessary as re-downloading the .p12 file is imposible.
	 * It provides consumers with opportunity to deliberately reissue account's development certificate. It will default to true as it is the excpected behaviour.
	 */
	clean?: boolean;
}

/**
 * Defines operations for generation codesign files in the cloud.
 */
interface ICloudCodesignService extends ICloudOperationService {
	/**
	 * Generates codesign files in the cloud and returns s3 urls to certificate or/and provision.
	 * @param {ICodesignData} codesignData apple speicific information.
	 * @param {IProjectData} projectData DTO with information about the project.
	 * @returns {Promise<ICodesignResultData>} Information about the generation process. It is returned only on successfull generation. In case there is some error, the Promise is rejected with the server information.
	 */
	generateCodesignFiles(codesignData: ICodesignData, projectData: IProjectData): Promise<ICodesignResultData>;
}
