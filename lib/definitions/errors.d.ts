interface IStdError extends Error {
	/** 
	 * If the error comes from process and have some stderr information - use this property to store it.
	 */
	stderr: string;
}
