import * as path from "path";
import { EOL } from "os";
import { CloudService } from "./cloud-service";

export class CloudProjectService extends CloudService implements ICloudProjectService {
	protected get failedError(): string {
		return "Cloud cleanup failed.";
	}

	protected get failedToStartError(): string {
		return "Failed to start cloud cleanup.";
	}

	constructor($errors: IErrors,
		$fs: IFileSystem,
		$httpClient: Server.IHttpClient,
		$logger: ILogger,
		$nsCloudOperationFactory: ICloudOperationFactory,
		$nsCloudOutputFilter: ICloudOutputFilter,
		$processService: IProcessService,
		private $nsCloudServerProjectService: IServerProjectService,
		private $projectHelper: IProjectHelper) {
		super($errors, $fs, $httpClient, $logger, $nsCloudOperationFactory, $nsCloudOutputFilter, $processService);
	}

	public getServerOperationOutputDirectory(options: IOutputDirectoryOptions): string {
		return path.join(options.projectDir, "cleanup-results");
	}

	public async cleanupProject(cleanupRequestData: ICleanupRequestDataBase): Promise<ICleanupProjectResult> {
		let identifiers: string[];
		const cleanupTaskResults = [];

		if (typeof cleanupRequestData.appIdentifier === "string") {
			identifiers = [cleanupRequestData.appIdentifier];
		} else {
			identifiers = _.uniq(_.values(cleanupRequestData.appIdentifier));
		}

		for (let index = 0; index < identifiers.length; index++) {
			const appIdentifier = identifiers[index];
			const taskResult = await this.startCleanProject({ appIdentifier, projectName: cleanupRequestData.projectName });
			cleanupTaskResults.push(taskResult);
		}

		return {
			cleanupTaskResults
		};
	}

	private async startCleanProject(cleanupProjectData: ICleanupProjectDataBase): Promise<ICleanupTaskResult> {
		const result = await this.executeCloudOperation("Cloud cleanup", async (cloudOperationId: string): Promise<ICleanupTaskResult> => {
			const res = await this.executeCleanupProject(cloudOperationId, cleanupProjectData);
			this.$logger.trace(`Cleanup [${cloudOperationId}] result: `, res);
			return res;
		});

		return result;
	}

	private async executeCleanupProject(cloudOperationId: string, { appIdentifier, projectName }: ICleanupProjectDataBase): Promise<ICleanupTaskResult> {
		this.$logger.info(`Cloud cleanup: Application Id: ${appIdentifier}, Project Name: ${projectName}.`);

		const sanitizedProjectName = this.$projectHelper.sanitizeName(projectName);
		const cleanupProjectData: ICleanupProjectData = {
			appIdentifier: appIdentifier,
			projectName: sanitizedProjectName,
			templateAppName: sanitizedProjectName
		};

		const cleanupResponse = await this.$nsCloudServerProjectService.cleanupProjectData(cleanupProjectData);
		this.$logger.trace("Cleanup response: ", cleanupResponse);

		if (cleanupResponse.warnings && cleanupResponse.warnings.length) {
			this.$logger.error("### Errors while cleaning cloud project data:");
			this.$logger.error(_.map(cleanupResponse.warnings, w => w.message).join(EOL));
		}

		this.$logger.info(`### AWS CodeCommit cleanup${EOL}`);
		if (cleanupResponse.codeCommitResponse) {
			this.$logger.info(`Cleaned repository: ${cleanupResponse.codeCommitResponse.repositoryId}.`);
		} else {
			this.$logger.info("No AWS CodeCommit data to clean.");
		}

		this.$logger.info(`${EOL}### Build machines cleanup${EOL}`);
		const tasksResults = await this.waitForAllCleanOperationsToFinish(cleanupResponse.buildMachineResponse);

		const result: ICleanupTaskResult = {
			cloudOperationId,
			warnings: cleanupResponse.warnings,
			codeCommitResponse: cleanupResponse.codeCommitResponse,
			cloudTasksResults: tasksResults
		};

		return result;
	}

	private async waitForAllCleanOperationsToFinish(serverResponses: IServerResponse[]): Promise<IDictionary<IServerResult>> {
		const childTasks = _.map(serverResponses, task => this.waitForChildTaskToFinish(task));

		const tasksResults: IDictionary<IServerResult> = {};
		for (let task of childTasks) {
			const result = await task;
			if (result.taskResult) {
				tasksResults[result.cloudOperationId] = result.taskResult;
			}

			this.$logger.info(result.output);

			if (result.err && result.err.trim().length > 0) {
				this.$logger.error(result.err);
			}
		}

		return tasksResults;
	}

	private async waitForChildTaskToFinish(task: IServerResponse): Promise<IChildTaskExecutionResult> {
		const childCloudOperationId = task.cloudOperationId;
		let output = `Child cloud operation id: ${childCloudOperationId}`;
		const taskResult = await this.waitForCloudOperationToFinish(childCloudOperationId, task, { silent: true, hideBuildMachineMetadata: true });
		output += await this.getCollectedLogs(task.cloudOperationId);
		const result: IChildTaskExecutionResult = { taskResult, output, cloudOperationId: task.cloudOperationId };
		if (taskResult.code !== 0) {
			result.err = `${childCloudOperationId} error: ${taskResult.errors}`;
		}

		return result;
	}
}

interface IChildTaskExecutionResult extends ICloudOperationId {
	output: string;
	taskResult?: IServerResult;
	err?: string;
}

$injector.register("nsCloudProjectService", CloudProjectService);
