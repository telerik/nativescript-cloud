import * as path from "path";
import * as uuid from "uuid";
import { EOL } from "os";
import { CloudService } from "./cloud-service";

export class CloudProjectService extends CloudService implements ICloudProjectService {
	protected get failedError() {
		return "Cloud cleanup failed.";
	}

	protected get failedToStartError() {
		return "Failed to start cloud cleanup.";
	}

	constructor($fs: IFileSystem,
		$httpClient: Server.IHttpClient,
		$logger: ILogger,
		private $nsCloudServerProjectService: IServerProjectService,
		private $projectHelper: IProjectHelper) {
		super($fs, $httpClient, $logger);
	}

	public getServerOperationOutputDirectory(options: ICloudServerOutputDirectoryOptions): string {
		return path.join(options.projectDir, "cleanup-results");
	}

	public async cleanupProject(appIdentifier: string, projectName: string): Promise<ICleanupProjectResult> {
		const cleanupTaskId = uuid.v4();
		try {
			const result = await this.executeCleanupProject(cleanupTaskId, appIdentifier, projectName);
			this.$logger.trace(`Cleanup [${cleanupTaskId}] result: `, result);
			return result;
		} catch (err) {
			err.cleanupTaskId = cleanupTaskId;
			throw err;
		}
	}

	private async executeCleanupProject(cleanupTaskId: string, appIdentifier: string, projectName: string): Promise<ICleanupProjectResult> {
		const cleanupInfoMessage = `Application Id: ${appIdentifier}, Cleanup Task Id: ${cleanupTaskId}`;
		this.$logger.info(`Starting cloud cleanup: ${cleanupInfoMessage}.`);

		const sanitizedProjectName = this.$projectHelper.sanitizeName(projectName);
		const cleanupProjectData: ICleanupProjectData = {
			appIdentifier: appIdentifier,
			projectName: sanitizedProjectName,
			templateAppName: sanitizedProjectName,
			projectCleanupId: cleanupTaskId
		};

		const cleanupResponse = await this.$nsCloudServerProjectService.cleanupProjectData(cleanupProjectData);
		this.$logger.trace("Cleanup response: ", cleanupResponse);

		if (cleanupResponse.warnings && cleanupResponse.warnings.length) {
			this.$logger.error("### Errors while cleaning cloud project data:");
			this.$logger.error(_.map(cleanupResponse.warnings, w => w.message).join(EOL));
		}

		this.$logger.info(`### Code Commit cleanup${EOL}`);
		if (cleanupResponse.codeCommitResponse) {
			this.$logger.info(`Cleaned repository: ${cleanupResponse.codeCommitResponse.repositoryId}.`);
		} else {
			this.$logger.info("No Code Commit data to clean.");
		}

		const tasksResults: IDictionary<IServerResult> = {};
		this.$logger.info(`${EOL}### Build machines cleanup${EOL}`);
		for (let i = 0; i < cleanupResponse.buildMachineResponse.length; i++) {
			const taskId = `Cloud Cleanup Task #${i + 1}`;
			const task = cleanupResponse.buildMachineResponse[i];
			try {
				await this.waitForServerOperationToFinish(taskId, task);
				const taskResult = await this.getObjectFromS3File<IServerResult>(task.resultUrl);
				if (taskResult.stdout && taskResult.stdout.trim().length) {
					this.$logger.info(taskResult.stdout);
				}

				if (taskResult.stderr) {
					this.$logger.error(taskResult.stderr);
				}

				tasksResults[taskId] = taskResult;
			} catch (err) {
				// We don't want to stop the execution if one of the tasks fails.
				this.$logger.error(`${taskId} error: ${err}`);
			}
		}

		const result: ICleanupProjectResult = {
			cleanupTaskId: cleanupTaskId,
			warnings: cleanupResponse.warnings,
			codeCommitResponse: cleanupResponse.codeCommitResponse,
			cloudTasks: tasksResults
		};

		return result;
	}

	protected getServerResults(result: IBuildServerResult): IServerItem[] {
		return [];
	}

	protected async getServerLogs(logsUrl: string, cloudTaskId: string): Promise<void> { /* no need for implementation */ }
}

$injector.register("nsCloudProjectService", CloudProjectService);
