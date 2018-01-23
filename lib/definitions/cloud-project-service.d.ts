/**
 * Defines the properties of the project cleanup method.
 */
interface ICleanupProjectResult {
	cleanupTaskId: string;
	cloudTasks: IDictionary<IServerResult>;
	codeCommitResponse: IDeleteRepositoryResponse;
	warnings: Error[];
}

/**
 * Defines operations for managing cloud projects.
 */
interface ICloudProjectService extends ICloudOperationService {
	/**
	 * Cleans all Code Commit data and build machines artefacts if they exist.
	 * @param {string} appIdentifier the application identifier.
	 * @param {string} projectName the project name.
	 * @returns {Promise<ICleanupProjectResult>} Information about the cleanup. It includes Code Commit result and the result from the cleanup on each build machine.
	 * If the promise is rejected the error will contain cleanupTaskId property.
	 */
	cleanupProject(appIdentifier: string, projectName: string): Promise<ICleanupProjectResult>;
}
