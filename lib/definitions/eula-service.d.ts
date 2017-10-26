interface IEulaService {
	getEulaData(): Promise<IEulaData>;
	getEulaDataWithCache(): Promise<IEulaData>
	acceptEula(): Promise<void>;
}

interface IEulaData {
	url: string;
	shouldAcceptEula: boolean;
}