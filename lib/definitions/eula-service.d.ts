/**
 * Describes methods for working with EULA.
 */
interface IEulaService {
	/**
	 * Gives information about the EULA. This method downloads the EULA to a local file (once for process).
	 * @returns {Promise<IEulaData>} Information about the EULA - url and should the user accept it.
	 */
	getEulaData(): Promise<IEulaData>;

	/**
	 * Gives information about the EULA. This method downloads the EULA to a local file (once for process)
	 * only in case the local copy has not been modified for more than 24 hours.
	 * @returns {Promise<IEulaData>} Information about the EULA - url and should the user accept it.
	 */
	getEulaDataWithCache(): Promise<IEulaData>;

	/**
	 * Accepts the EULA. The method first downloads the latest EULA (in case it has not been already downloaded in current process) and saves its shasum to user settings file.
	 * @returns {Promise<void>}
	 */
	acceptEula(): Promise<void>;
}

/**
 * Contains information about EULA.
 */
interface IEulaData {
	/**
	 * URL where the EULA can be found.
	 */
	url: string;

	/**
	 * Defines if EULA should be accepted by user.
	 */
	shouldAcceptEula: boolean;
}
