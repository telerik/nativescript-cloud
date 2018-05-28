import * as path from "path";
import { sysInfo } from "nativescript-doctor";
import { fromWindowsRelativePathToUnix } from "../helpers";

export class GitService implements IGitService {
	private static REMOTE_NAME = "cloud";
	private static BRANCH_NAME = "master";
	private static GIT_DIR_NAME = ".cloud-git";
	private static GIT_IGNORE_FILE_NAME = ".gitignore";
	private static TEMPLATE_GIT_IGNORE_FILE_NAME = "template-.gitignore";
	private static MAX_TIME_FOR_UNUSED_REPOSITORY = 1000 * 3600 * 24 * 30;
	private static MINIMAL_GIT_MAJOR_VERSION = 2;
	private static MINIMAL_GIT_MINOR_VERSION = 9;

	private gitFilePath: string;

	constructor(
		private $childProcess: IChildProcess,
		private $fs: IFileSystem,
		private $hostInfo: IHostInfo,
		private $logger: ILogger,
		private $options: IProfileDir,
		private $nsCloudUserService: IUserService,
		private $nsCloudHashService: IHashService) { }

	public async gitPushChanges(projectSettings: INSCloudProjectSettings, remoteUrl: IRemoteUrl, codeCommitCredential: ICodeCommitCredentials, repositoryState?: IRepositoryState): Promise<void> {
		this.cleanLocalRepositories();
		if (repositoryState && repositoryState.isNewRepository) {
			this.deleteLocalRepository(projectSettings);
		}

		if (!this.isGitRepository(projectSettings)) {
			await this.gitInit(projectSettings);
		}

		const isRemoteAdded = await this.gitCheckIfRemoteIsAdded(projectSettings, GitService.REMOTE_NAME);
		if (isRemoteAdded) {
			const isGitRemoteCorrect = await this.isGitRemoteSetToCorrectUrl(projectSettings, remoteUrl);
			if (!isGitRemoteCorrect) {
				await this.gitSetRemoteUrl(projectSettings, GitService.REMOTE_NAME, remoteUrl);
			}
		} else {
			await this.gitRemoteAdd(projectSettings, remoteUrl);
		}

		await this.ensureGitIgnoreExists(projectSettings.projectDir);

		await this.configureEnvironment(projectSettings, remoteUrl);
		const statusResult = await this.gitStatus(projectSettings);
		this.$logger.trace(`Result of git status: ${statusResult}.`);

		if (this.hasNothingToCommit(statusResult.stdout)) {
			this.$logger.trace("Nothing to commit. Just push force the branch.");
			await this.gitPush(projectSettings, codeCommitCredential);
			return;
		}

		await this.gitAdd(projectSettings);
		await this.gitCommit(projectSettings);

		await this.gitPush(projectSettings, codeCommitCredential);
	}

	private cleanLocalRepositories(): void {
		if (!this.$fs.exists(this.getGitDirBasePath())) {
			return;
		}

		const entries = this.$fs.readDirectory(this.getGitDirBasePath())
			.map(entry => path.join(this.getGitDirBasePath(), entry));
		_.each(entries, entry => {
			const stats = this.$fs.getFsStats(entry);
			if (new Date().getTime() - stats.ctime.getTime() > GitService.MAX_TIME_FOR_UNUSED_REPOSITORY) {
				this.$fs.deleteDirectory(entry);
			}
		});
	}

	private async isGitRemoteSetToCorrectUrl(projectSettings: INSCloudProjectSettings, remoteUrl: IRemoteUrl): Promise<boolean> {
		const result = await this.executeCommand(projectSettings, ["remote", "-v"]);
		return result.stdout.indexOf(remoteUrl.httpRemoteUrl) !== -1;
	}

	private async configureEnvironment(projectSettings: INSCloudProjectSettings, remoteUrl: IRemoteUrl): Promise<void> {
		const gitVersion = await sysInfo.getGitVersion();
		if (gitVersion) {
			const match = gitVersion.match(/^(\d+?)\.(\d+?)\.\d+.*$/);
			const gitMajorVersion = ~~match[1];
			const gitMinorVersion = ~~match[2];
			// After version 2.9.x git prompt for credential with Windows Credential Manager first then query over the rest of the credential managers.
			// If credential.helper is configured to the empty string,
			// this resets the helper list to empty (so you may override a helper set by a lower-priority config file by configuring the empty-string helper,
			// followed by whatever set of helpers you would like).
			// https://git-scm.com/docs/gitcredentials
			if (this.$hostInfo.isWindows) {
				if (gitMajorVersion === GitService.MINIMAL_GIT_MAJOR_VERSION &&
					gitMinorVersion >= GitService.MINIMAL_GIT_MINOR_VERSION) {
					await this.executeCommand(projectSettings, ["config", "--local", `credential.${remoteUrl.httpRemoteUrl}.helper`, ""]);
				} else {
					throw new Error(`Unsupported Git version: ${gitVersion}. The minimal supported version is 2.9.0. Please update.`);
				}
			}
		}

		await this.executeCommand(projectSettings, ["config", "--local", "credential.helper", this.getCredentialHelperPath()]);
		await this.executeCommand(projectSettings, ["config", "--local", "credential.UseHttpPath", "true"]);
	}

	private async gitInit(projectSettings: INSCloudProjectSettings): Promise<ISpawnResult> {
		return this.executeCommand(projectSettings, ["init"]);
	}

	private async gitCommit(projectSettings: INSCloudProjectSettings): Promise<ISpawnResult> {
		return this.executeCommand(projectSettings, ["commit", `-m "cloud-commit-${new Date().toString()}"`]);
	}

	private async gitAdd(projectSettings: INSCloudProjectSettings): Promise<ISpawnResult> {
		return this.executeCommand(projectSettings, ["add", projectSettings.projectDir]);
	}

	private async gitStatus(projectSettings: INSCloudProjectSettings): Promise<ISpawnResult> {
		return this.executeCommand(projectSettings, ["status"]);
	}

	private async gitPush(projectSettings: INSCloudProjectSettings, codeCommitCredential: ICodeCommitCredentials): Promise<ISpawnResult> {
		const env = _.assign({}, process.env, {
			AWS_ACCESS_KEY_ID: codeCommitCredential.accessKeyId,
			AWS_SECRET_ACCESS_KEY: codeCommitCredential.secretAccessKey,
			AWS_SESSION_TOKEN: codeCommitCredential.sessionToken
		});

		return this.executeCommand(projectSettings, ["push", "--force", GitService.REMOTE_NAME, GitService.BRANCH_NAME], { env, cwd: projectSettings.projectDir });
	}

	private async gitRemoteAdd(projectSettings: INSCloudProjectSettings, remoteUrl: IRemoteUrl, ) {
		return this.executeCommand(projectSettings, ["remote", "add", GitService.REMOTE_NAME, remoteUrl.httpRemoteUrl]);
	}

	private async gitSetRemoteUrl(projectSettings: INSCloudProjectSettings, remoteName: string, remoteUrl: IRemoteUrl) {
		await this.executeCommand(projectSettings, ["remote", "set-url", remoteName, remoteUrl.httpRemoteUrl]);
	}

	private async gitCheckIfRemoteIsAdded(projectSettings: INSCloudProjectSettings, remoteName: string) {
		try {
			await this.executeCommand(projectSettings, ["remote", "get-url", remoteName]);
			return true;
		} catch (err) {
			this.$logger.trace("Error while checking if remote is added: ", err);
			return false;
		}
	}

	private async executeCommand(projectSettings: INSCloudProjectSettings, args: string[], options?: any, spawnFromEventOptions?: ISpawnFromEventOptions): Promise<ISpawnResult> {
		options = options || { cwd: projectSettings.projectDir };
		const gitDir = this.getGitDirPath(projectSettings);
		this.$fs.ensureDirectoryExists(gitDir);
		const command = await this.getGitFilePath();
		args = [`--git-dir=${gitDir}`, `--work-tree=${projectSettings.projectDir}`].concat(args);
		return this.$childProcess.spawnFromEvent(command, args, "close", options, spawnFromEventOptions);
	}

	private deleteLocalRepository(projectSettings: INSCloudProjectSettings) {
		if (this.isGitRepository(projectSettings)) {
			this.$fs.deleteDirectory(this.getGitDirPath(projectSettings));
		}
	}

	private isGitRepository(projectSettings: INSCloudProjectSettings): boolean {
		return this.$fs.exists(this.getGitDirPath(projectSettings));
	}

	private getGitDirPath(projectSettings: INSCloudProjectSettings): string {
		return path.join(this.getGitDirBasePath(), this.getGitDirName(projectSettings));
	}

	private getGitDirBasePath(): string {
		return path.join(this.$options.profileDir, GitService.GIT_DIR_NAME);
	}

	private getGitDirName(projectSettings: INSCloudProjectSettings): string {
		const dirName = `${this.$nsCloudUserService.getUser().email}_${projectSettings.projectDir}_${projectSettings.projectId}`;
		return this.$nsCloudHashService.getHash(dirName, { algorithm: "sha1" });
	}

	private async getGitFilePath(): Promise<string> {
		if (!this.gitFilePath) {
			this.gitFilePath = await sysInfo.getGitPath();

			this.$logger.trace(`Path to git is: ${this.gitFilePath}.`);

			if (!this.gitFilePath) {
				throw new Error("Git Installation Not Found. Install Git to improve the speed of cloud builds.");
			}
		}

		return this.gitFilePath;
	}

	private ensureGitIgnoreExists(projectDir: string): void {
		const gitIgnorePath = path.join(projectDir, GitService.GIT_IGNORE_FILE_NAME);
		this.$logger.trace(`Ensure ${gitIgnorePath} exists.`);
		if (!this.$fs.exists(gitIgnorePath)) {
			this.$logger.trace(`${gitIgnorePath} does not exist. Creating a default one.`);
			const gitIgnoreResourceFile = path.join(this.getGitResourceFolder(), GitService.TEMPLATE_GIT_IGNORE_FILE_NAME);
			this.$fs.copyFile(gitIgnoreResourceFile, gitIgnorePath);
		}
	}

	private getCredentialHelperPath(): string {
		const credentialHelperPath = path.join(this.getGitResourceFolder(), "aws-credential-helper", "credential-helper");
		return fromWindowsRelativePathToUnix(credentialHelperPath);
	}

	private getGitResourceFolder(): string {
		return path.join(__dirname, "..", "..", "resources", "git");
	}

	private hasNothingToCommit(stdout: string): boolean {
		return /nothing to commit/.test(stdout);
	}
}

$injector.register("nsCloudGitService", GitService);
