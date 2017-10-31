/**
 * Wrapper for Date object.
 */
interface IDateTimeService {
	/**
	 * Gives information for the current time in Epoch (since 1 Jan 1970).
	 * Wrapper for new Date().getTime() method.
	 * @returns {number} The number of milliseconds between midnight of January 1, 1970 and the current time.
	 */
	getCurrentEpochTime(): number;
}
