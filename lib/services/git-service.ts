import * as path from "path";
import * as crypto from "crypto";
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
		private $options: IProfileDir) { }

	public async gitPushChanges(projectDir: string, remoteUrl: IRemoteUrl, codeCommitCredential: ICodeCommitCredentials, repositoryState?: IRepositoryState): Promise<void> {
		this.cleanLocalRepositories();
		if (repositoryState && repositoryState.isNewRepository) {
			this.deleteLocalRepository(projectDir);
		}

		if (!this.isGitRepository(projectDir)) {
			await this.gitInit(projectDir);
		}

		await this.configureEnvironment(projectDir, remoteUrl);
		const statusResult = await this.gitStatus(projectDir);
		if (this.nothingToCommit(statusResult.stdout)) {
			await this.gitPush(projectDir, codeCommitCredential);
			return;
		}

		await this.gitAdd(projectDir);
		await this.gitCommit(projectDir);

		if (!(await this.isGitRemoteSet(projectDir, remoteUrl))) {
			await this.gitRemoteAdd(projectDir, remoteUrl);
		}

		await this.gitPush(projectDir, codeCommitCredential);
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

	private async isGitRemoteSet(projectDir: string, remoteUrl: IRemoteUrl): Promise<boolean> {
		const result = await this.executeCommand(projectDir, ["remote", "-v"]);
		return result.stdout.indexOf(remoteUrl.httpRemoteUrl) !== -1;
	}

	private async configureEnvironment(projectDir: string, remoteUrl: IRemoteUrl): Promise<void> {
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
			if (this.$hostInfo.isWindows &&
				gitMajorVersion === GitService.MINIMAL_GIT_MAJOR_VERSION &&
				gitMinorVersion >= GitService.MINIMAL_GIT_MINOR_VERSION) {
				await this.executeCommand(projectDir, ["config", "--local", `credential.${remoteUrl.httpRemoteUrl}.helper`, ""]);
			}
		}

		await this.executeCommand(projectDir, ["config", "--local", "credential.helper", this.getCredentialHelperPath()]);
		await this.executeCommand(projectDir, ["config", "--local", "credential.UseHttpPath", "true"]);
	}

	private async gitInit(projectDir: string): Promise<ISpawnResult> {
		return this.executeCommand(projectDir, ["init"]);
	}

	private async gitCommit(projectDir: string): Promise<ISpawnResult> {
		return this.executeCommand(projectDir, ["commit", `-m "cloud-commit-${new Date().toString()}"`]);
	}

	private async gitAdd(projectDir: string): Promise<ISpawnResult> {
		return this.executeCommand(projectDir, ["add", projectDir]);
	}

	private async gitStatus(projectDir: string): Promise<ISpawnResult> {
		return this.executeCommand(projectDir, ["status"]);
	}

	private async gitPush(projectDir: string, codeCommitCredential: ICodeCommitCredentials): Promise<ISpawnResult> {
		this.ensureGitIgnoreExists(projectDir);
		const env = _.assign({}, process.env, {
			AWS_ACCESS_KEY_ID: codeCommitCredential.accessKeyId,
			AWS_SECRET_ACCESS_KEY: codeCommitCredential.secretAccessKey,
			AWS_SESSION_TOKEN: codeCommitCredential.sessionToken
		});

		return this.executeCommand(projectDir, ["push", "--force", GitService.REMOTE_NAME, GitService.BRANCH_NAME], { env, cwd: projectDir });
	}

	private async gitRemoteAdd(projectDir: string, remoteUrl: IRemoteUrl, ) {
		return this.executeCommand(projectDir, ["remote", "add", GitService.REMOTE_NAME, remoteUrl.httpRemoteUrl]);
	}

	private async executeCommand(projectDir: string, args: string[], options?: any, spawnFromEventOptions?: ISpawnFromEventOptions): Promise<ISpawnResult> {
		options = options || { cwd: projectDir };
		const gitDir = this.getGitDirPath(projectDir);
		this.$fs.ensureDirectoryExists(gitDir);
		const command = await this.getGitFilePath();
		args = [`--git-dir=${gitDir}`, `--work-tree=${projectDir}`].concat(args);
		return this.$childProcess.spawnFromEvent(command, args, "close", options, spawnFromEventOptions);
	}

	private deleteLocalRepository(projectDir: string) {
		if (this.isGitRepository(projectDir)) {
			this.$fs.deleteDirectory(this.getGitDirPath(projectDir));
		}
	}

	private isGitRepository(projectDir: string): boolean {
		return this.$fs.exists(this.getGitDirPath(projectDir));
	}

	private getGitDirPath(projectDir: string): string {
		return path.join(this.getGitDirBasePath(), this.getGitDirName(projectDir));
	}

	private getGitDirBasePath(): string {
		return path.join(this.$options.profileDir, GitService.GIT_DIR_NAME);
	}

	private getGitDirName(projectDir: string): string {
		const shasumData = crypto.createHash("sha1");
		shasumData.update(projectDir);
		const gitDirName = shasumData.digest("hex");

		return gitDirName;
	}

	private async getGitFilePath(): Promise<string> {
		if (!this.gitFilePath) {
			this.gitFilePath = await sysInfo.getGitPath();

			if (!this.gitFilePath) {
				throw new Error("Git Installation Not Found. Install Git to improve the speed of cloud builds.");
			}
		}

		return this.gitFilePath;
	}

	private ensureGitIgnoreExists(projectDir: string): void {
		const gitIgnorePath = path.join(projectDir, GitService.GIT_IGNORE_FILE_NAME);
		if (!this.$fs.exists(gitIgnorePath)) {
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

	private nothingToCommit(stdout: string): boolean {
		return /nothing to commit/.test(stdout);
	}
}

$injector.register("gitService", GitService);
