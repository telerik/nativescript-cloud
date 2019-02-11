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
		$nsCloudS3Service: IS3Service,
		$nsCloudOutputFilter: ICloudOutputFilter,
		$processService: IProcessService,
		private $nsCloudServerProjectService: IServerProjectService,
		private $projectHelper: IProjectHelper) {
		super($errors, $fs, $httpClient, $logger, $nsCloudOperationFactory, $nsCloudS3Service, $nsCloudOutputFilter, $processService);
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

		const tasksResults: IDictionary<IServerResult> = {};
		this.$logger.info(`${EOL}### Build machines cleanup${EOL}`);
		const childTasks: Promise<IChildTaskExecutionResult>[] = [];
		for (let task of cleanupResponse.buildMachineResponse) {
			const executeChildTask = async (): Promise<IChildTaskExecutionResult> => {
				const childCloudOperationId = task.cloudOperationId;
				let output = `Child cloud operation id: ${childCloudOperationId}`;
				try {
					const taskResult = await this.waitForServerOperationToFinish(childCloudOperationId, task, { silent: true });
					tasksResults[childCloudOperationId] = taskResult;
					output += await this.getCollectedLogs(task);
					return { output };
				} catch (err) {
					if (this.getResult(childCloudOperationId)) {
						tasksResults[childCloudOperationId] = this.getResult(childCloudOperationId);
					}

					// We don't want to stop the execution if one of the tasks fails.
					return { output, err: `${childCloudOperationId} error: ${err}` };
				}
			};

			childTasks.push(executeChildTask());
		}

		for (let task of childTasks) {
			const taskResult = await task;
			this.$logger.info(taskResult.output);

			if (this.hasContent(taskResult.err)) {
				this.$logger.error(taskResult.err);
			}
		}

		const result: ICleanupTaskResult = {
			cloudOperationId,
			warnings: cleanupResponse.warnings,
			codeCommitResponse: cleanupResponse.codeCommitResponse,
			cloudTasksResults: tasksResults
		};

		return result;
	}

	protected getServerResults(result: ICloudOperationResult): IServerItem[] {
		return [];
	}

	protected async getServerLogs(logsUrl: string, cloudTaskId: string): Promise<void> { /* no need for implementation */ }

	private hasContent(input: string): boolean {
		return input && input.trim().length > 0;
	}
}

interface IChildTaskExecutionResult {
	output: string;
	err?: string;
}

$injector.register("nsCloudProjectService", CloudProjectService);
