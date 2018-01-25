interface IVersionService {
	getCliVersion(runtimeVersion: string): Promise<string>;
	getRuntimeVersion(platform: string, nativescriptData: any, coreModulesVersion: string): Promise<string>;
	getCoreModulesVersion(projectDir: string): string;
}
