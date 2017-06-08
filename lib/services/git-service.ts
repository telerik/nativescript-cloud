import * as path from "path";
import * as crypto from "crypto";
import { fromWindowsRelativePathToUnix } from "../helpers";

export class GitService implements IGitService {
	private static REMOTE_NAME = "cloud";
	private static BRANCH_NAME = "master";
	private static GIT_DIR_NAME = ".cloud-git";
	private static GIT_IGNORE_FILE_NAME = ".gitignore";
	private static TEMPLATE_GIT_IGNORE_FILE_NAME = "template-.gitignore";
	private static MAX_TIME_FOR_UNUSED_REPOSITORY = 1000 * 3600 * 24 * 30;

	private gitFilePath: string;
	private gitDirName: string;

	constructor(
		private $childProcess: IChildProcess,
		private $fs: IFileSystem,
		private $options: IProfileDir) { }

	public async gitPushChanges(projectDir: string, remoteUrl: IRemoteUrl, codeCommitCredential: ICodeCommitCredentials, isNewRepository?: boolean): Promise<void> {
		this.cleanLocalRepositories();
		if (isNewRepository) {
			this.deleteLocalRepository(projectDir);
		}

		if (!this.isGitRepository(projectDir)) {
			await this.gitInit(projectDir);
		}

		await this.configureEnvironment(projectDir);
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

	private async configureEnvironment(projectDir: string): Promise<void> {
		await this.executeCommand(projectDir, ["config", "--local", "credential.helper", this.getCredentialHelparPath()]);
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

	private async executeCommand(projectDir: string, args: string[], options?: any, spawnFromEventOptins?: ISpawnFromEventOptions): Promise<ISpawnResult> {
		options = options || { cwd: projectDir };
		const gitDir = this.getGitDirPath(projectDir);
		this.$fs.ensureDirectoryExists(gitDir);
		const command = await this.getGitFilePath();
		args = [`--git-dir=${gitDir}`, `--work-tree=${projectDir}`].concat(args);
		return this.$childProcess.spawnFromEvent(command, args, "close", options, spawnFromEventOptins);
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
		if (!this.gitDirName) {
			const shasumData = crypto.createHash("sha1");
			this.gitDirName = shasumData.digest("hex");
		}

		return this.gitDirName;
	}

	private async getGitFilePath(): Promise<string> {
		if (!this.gitFilePath) {
			this.gitFilePath = await this.findGit();
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

	private getCredentialHelparPath(): string {
		const credentialHelperPath = path.join(this.getGitResourceFolder(), "aws-credential-helper", "credential-helper");
		return fromWindowsRelativePathToUnix(credentialHelperPath);
	}

	private getGitResourceFolder(): string {
		return path.join(__dirname, "..", "..", "resources", "git");
	}

	private findGit(): Promise<string> {
		return process.platform === 'win32' ? this.findGitWin32() : this.findGitUnix();
	}

	private async findGitWin32(): Promise<string> {
		const win32Paths = [process.env['ProgramFiles(x86)'], process.env['ProgramFiles']];
		let result;
		_.each(win32Paths, win32Path => {
			result = this.findSystemGitWin32(win32Path);

			if (result) {
				return false;
			}
		});

		result = this.findGitHubGitWin32();

		return result ? result : this.findGitCore("where");
	}

	private findSystemGitWin32(base: string): string {
		return this.findSpecificGit(path.join(base, 'Git', 'cmd', 'git.exe'));
	}

	private findGitHubGitWin32(): string {
		const github = path.join(process.env['LOCALAPPDATA'], 'GitHub');

		const children = this.$fs.readDirectory(github);
		const git = children.filter(child => /^PortableGit/.test(child))[0];

		return this.findSpecificGit(path.join(github, git, 'cmd', 'git.exe'));
	}

	private findSpecificGit(gitPath: string): string {
		if (this.$fs.exists(gitPath)) {
			return gitPath;
		}
	}

	private async findGitUnix(): Promise<string> {
		return await this.findGitCore("which");
	}

	private async findGitCore(command: string, options?: any): Promise<string> {
		const result = await this.$childProcess.spawnFromEvent(command, ["git"], "close", options, { throwError: false });

		if (result.exitCode !== 0) {
			throw new Error("It looks like Git is not installed on your system.");
		}

		return result.stdout.split("\n")[0].trim();
	}

	private nothingToCommit(stdout: string): boolean {
		return /nothing to commit, working directory clean/.test(stdout);
	}
}

$injector.register("gitService", GitService);
