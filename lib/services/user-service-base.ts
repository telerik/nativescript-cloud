export abstract class UserServiceBase {
	protected userFilePath: string;

	private get $nsCloudServerAccountsService(): IServerAccountsService {
		return this.$injector.resolve<IServerAccountsService>("nsCloudServerAccountsService");
	}

	constructor(private $injector: IInjector,
		private $logger: ILogger,
		private $fs: IFileSystem,
		private $nsCloudErrorsService: IErrors) { }

	public hasUser(): boolean {
		try {
			const user = this.getUser();
			return !!user;
		} catch (err) {
			return false;
		}
	}

	public getUser(): IUser {
		const userData = this.getUserData();

		return userData.userInfo;
	}

	public getUserData(): any {
		try {
			return this.$fs.readJson(this.userFilePath);
		} catch (err) {
			this.$logger.trace("Error while getting current user info:");
			this.$logger.trace(err);
			this.$nsCloudErrorsService.fail("Not logged in.");
		}
	}

	public setToken(token: ITokenData): void {
		if (token) {
			const newUserData = _.extend(this.getUserData(), token);
			this.setUserData(newUserData);
		} else {
			this.clearUserData();
		}
	}

	public setUserData(userData: any): void {
		if (userData) {
			this.$fs.writeJson(this.userFilePath, userData);
		} else {
			this.$fs.deleteFile(this.userFilePath);
		}
	}

	public clearUserData(): void {
		this.$fs.deleteFile(this.userFilePath);
	}

	public async getUserAvatar(): Promise<string> {
		if (!this.hasUser()) {
			return null;
		}

		const userInfo = await this.$nsCloudServerAccountsService.getUserInfo();
		return userInfo.externalAvatarUrl;
	}
}
