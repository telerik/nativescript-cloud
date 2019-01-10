export class NsCouldLockService implements ILockService {
	private cliLockService: ILockService;
	private cliLockFile: any;

	constructor(private $injector: IInjector) {
		try {
			this.cliLockService = this.$injector.resolve("lockService");
		} catch (e) {
			this.cliLockFile = this.$injector.resolve("lockfile");
		}
	}

	public async executeActionWithLock<T>(action: () => Promise<T>, lockFilePath?: string, lockOpts?: ILockOptions): Promise<T> {
		if (this.cliLockService) {
			const result = await this.cliLockService.executeActionWithLock(action, lockFilePath, lockOpts);
			return result;
		}

		await this.cliLockFile.lock(lockFilePath, lockOpts);
		try {
			const result = await action();
			return result;
		} finally {
			this.cliLockFile.unlock(lockFilePath);
		}
	}
}

$injector.register("nsCloudLockService", NsCouldLockService);
