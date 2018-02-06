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
interface ICodesignData extends ICredentials, IPlatform, ISharedCloud {
	/**
	 * Whether to revoke and reissue certificate even if it is not expired. This option is necessary as re-downloading the .p12 file is impossible.
	 * It provides consumers with opportunity to deliberately reissue account's development certificate. It will default to true as it is the expected behaviour.
	 */
	clean?: boolean;
	/**
	 * To generate development codesign files Apple API requires devices as development provisions are only issued for them.
	 */
	attachedDevices: Mobile.IDeviceInfo[];
}

/**
 * Defines operations for generation codesign files in the cloud.
 */
interface ICloudCodesignService extends ICloudOperationService {
	/**
	 * Generates codesign files in the cloud and returns s3 urls to certificate or/and provision.
	 * @param {ICodesignData} codesignData Apple specific information.
	 * @param {string} projectDir The path of the project.
	 * @returns {Promise<ICodesignResultData>} Information about the generation process. It is returned only on successful generation. In case there is some error, the Promise is rejected with the server information.
	 */
	generateCodesignFiles(codesignData: ICodesignData, projectDir: string): Promise<ICodesignResultData>;
}
