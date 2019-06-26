/**
 * Describes settings that can be passed to shouldBuild method
 */
interface IApplicationBuildConfig extends IBuildConfig, IBundle, IOptionalOutputPath, IProjectDir, IPlatform { }

/**
 * Describes settings that can be passed to shouldInstall method
 */
interface IApplicationInstallConfig extends Mobile.IDeviceIdentifier, IProjectDir, IOptionalOutputPath, IRelease { }

/**
 * Describes service which manages applications
 */
interface IApplicationService {
	/**
	 * Determines whether the application should be built or not.
	 * @param {IApplicationBuildConfig} config Settings used to help decide whether the project should be built or not.
	 * @returns {Promise<boolean>}
	 */
	shouldBuild(config: IApplicationBuildConfig): Promise<boolean>;

	/**
	 * Determines whether the application's output package should be installed on the given device or not.
	 * @param {IApplicationInstallConfig} config Settings used to help decide whether the project's output should be installed or not.
	 * @returns {Promise<boolean>}
	 */
	shouldInstall(config: IApplicationInstallConfig): Promise<boolean>;
}
