/**
 * Describes methods use in commands to check and accept EULA.
 */
interface IEulaCommandHelper {
	/**
	 * Prints the link to EULA and accepts it. Used for automation of accepting EULA.
	 * @returns {Promise<void>}
	 */
	acceptEula(): Promise<void>;

	/**
	 * Ensures EULA is accepted. In case it is not - asks the user for confirmation by using prompter in CLI.
	 * @returns {Promise<void>}
	 */
	ensureEulaIsAccepted(): Promise<void>;
}
