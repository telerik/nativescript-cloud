interface IServerProjectService {
	cleanupProjectData(projectData: ICleanupProjectData): Promise<ICleanupProjectResponse>
}

interface ICleanupProjectResponse {
	buildMachineResponse: IServerResponse[];
	codeCommitResponse: IDeleteRepositoryResponse;
	warnings: Error[];
}

interface ICleanupProjectData {
	appIdentifier: string;
	projectName: string;
	templateAppName: string;
	projectCleanupId: string;
}
