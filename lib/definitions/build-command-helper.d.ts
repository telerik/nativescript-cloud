/**
 * Describes helper that can be used for building.
 */
interface IBuildCommandHelper extends IBuildPlatformAction {
	/**
	 * Retrieves data needed to perform a cloud build.
	 * @param {string} platformArg The mobile platform for which the application should be built: Android or iOS.
	 * @returns {Promise<IBuildData>} Data needed for building in cloud.
	 */
	getCloudBuildData(platformArg: string): IBuildData;

	/**
	 * Builds the specified application either in the cloud or locally based on --local flag.
	 * @param {string} platformArg The mobile platform for which the application should be built: Android or iOS.
	 * @returns {Promise<string>} The location of the built package.
	 */
	buildForPublishingPlatform(platformArg: string): Promise<string>;

	/**
	 * Used to retrieve credentials for iTunes Connect from commands.
	 * @param {string[]} args The arguments passed to the command.
	 * @returns {Promise<ICredentials>} The credentials.
	 */
	getAppleCredentials(args: string[]): Promise<ICredentials>;
}