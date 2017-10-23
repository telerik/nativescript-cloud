interface IEulaService {
	shouldAcceptEula(): Promise<boolean>;
	acceptEula(): Promise<void>;
}
