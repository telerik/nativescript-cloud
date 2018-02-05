/**
 * Describes methods used to get different versions of components.
 */
interface IVersionService {
	/**
	 * Gives information for CLI version that should be used in the cloud.
	 * @param {string} runtimeVersion The runtime version based on which CLI version will be calculated.
	 * @returns {Promise<string>} CLI version that should be used in the cloud.
	 */
	getCliVersion(runtimeVersion: string): Promise<string>;

	/**
	 * Gives information for the version of a runtime used in the project.
	 * @param {string} projectDir The directory of the project.
	 * @param {string} platform The platform (iOS or Android).
	 * @returns {Promise<string>} The version of the runtime.
	 */
	getProjectRuntimeVersion(projectDir: string, platform: string): Promise<string>;
}
