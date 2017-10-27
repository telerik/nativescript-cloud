interface IEulaCommandHelper {
	acceptEula(): Promise<void>;
	ensureEulaIsAccepted(): Promise<void>;
}