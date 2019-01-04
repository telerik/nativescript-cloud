import * as path from "path";
import * as uuid from "uuid";
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
		$injector: IInjector,
		$nsCloudS3Service: IS3Service,
		$nsCloudOutputFilter: ICloudOutputFilter,
		private $nsCloudServerProjectService: IServerProjectService,
		private $projectHelper: IProjectHelper) {
		super($errors, $fs, $httpClient, $logger, $injector, $nsCloudS3Service, $nsCloudOutputFilter);
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
		const cloudOperationId = uuid.v4();
		try {
			const result = await this.executeCleanupProject(cloudOperationId, cleanupProjectData);
			this.$logger.trace(`Cleanup [${cloudOperationId}] result: `, result);
			return result;
		} catch (err) {
			err.cloudOperationId = cloudOperationId;
			throw err;
		}
	}

	private async executeCleanupProject(cloudOperationId: string, { appIdentifier, projectName }: ICleanupProjectDataBase): Promise<ICleanupTaskResult> {
		const cleanupInfoMessage = `Application Id: ${appIdentifier}, Project Name: ${projectName}, Cleanup Task Id: ${cloudOperationId}`;
		this.$logger.info(`Starting cloud cleanup: ${cleanupInfoMessage}.`);

		const sanitizedProjectName = this.$projectHelper.sanitizeName(projectName);
		const cleanupProjectData: ICleanupProjectData = {
			appIdentifier: appIdentifier,
			projectName: sanitizedProjectName,
			templateAppName: sanitizedProjectName,
			projectCleanupId: cloudOperationId
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
		for (let i = 0; i < cleanupResponse.buildMachineResponse.length; i++) {
			const taskId = `Cloud Cleanup Task #${i + 1}`;
			const task = cleanupResponse.buildMachineResponse[i];
			try {
				const taskResult = await this.waitForServerOperationToFinish(taskId, task);
				const output = await this.getCollectedLogs(task);
				if (this.hasContent(output)) {
					this.$logger.info(output);
				}

				tasksResults[taskId] = taskResult;
			} catch (err) {
				// We don't want to stop the execution if one of the tasks fails.
				this.$logger.error(`${taskId} error: ${err}`);
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

$injector.register("nsCloudProjectService", CloudProjectService);
