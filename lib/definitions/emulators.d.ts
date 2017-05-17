interface IAppetizeEmulatorStartData {
	packageFile: string;
	platform: string;
	model: string;
}

interface IAppetizeEmulatorLauncher {
	startEmulator(data: IAppetizeEmulatorStartData): Promise<string>;
}
