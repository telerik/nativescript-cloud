interface IServerProjectService {
	cleanupProjectData(projectData: ICleanupProjectData): Promise<ICleanupProjectResponse>
}

interface ICleanupProjectResponse {
	buildMachineResponse: IServerResponse[];
	codeCommitResponse: IDeleteRepositoryResponse;
	warnings: Error[];
}

/**
 * Describes data used for project cleaning passed from client.
 */
interface ICleanupProjectDataBase extends IProjectNameComposition {
	/**
	 * Application's identifier
	 */
	appIdentifier: string;
}

/**
 * Describes data used for project cleaning passed to server.
 */
interface ICleanupProjectData extends ICleanupProjectDataBase {
	templateAppName: string;
	projectCleanupId: string;
}
