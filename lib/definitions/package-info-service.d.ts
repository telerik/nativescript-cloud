/**
 * Describes methods for getting information about current package (nativescript-cloud).
 */
interface IPackageInfoService {
	/**
	 * Gets the version of `nativescript-cloud` library.
	 * @returns {string} The version specified in the package.json of the library.
	 */
	getVersion(): string;
}
