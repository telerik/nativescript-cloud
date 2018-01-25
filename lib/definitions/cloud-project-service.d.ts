/**
 * Defines the properties of the project cleanup method.
 */
interface ICleanupProjectResult {
	cleanupTaskId: string;
	cloudTasksResults: IDictionary<IServerResult>;
	codeCommitResponse: IDeleteRepositoryResponse;
	warnings: Error[];
}

/**
 * Defines operations for managing cloud projects.
 */
interface ICloudProjectService extends ICloudOperationService {
	/**
	 * Cleans all AWS CodeCommit data and build machines artefacts if they exist.
	 * @param {string} appIdentifier The application identifier.
	 * @param {string} projectName The project name.
	 * @returns {Promise<ICleanupProjectResult>} Information about the cleanup. It includes AWS CodeCommit result and the result from the cleanup on each build machine.
	 * If the promise is rejected the error will contain cleanupTaskId property.
	 */
	cleanupProject(appIdentifier: string, projectName: string): Promise<ICleanupProjectResult>;
}
