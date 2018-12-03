export abstract class UserServiceBase {
	private userData: IUserData;
	protected userFilePath: string;

	private get $nsCloudServerAccountsService(): IServerAccountsService {
		return this.$injector.resolve<IServerAccountsService>("nsCloudServerAccountsService");
	}

	private get $errors(): IErrors {
		return this.$injector.resolve<IErrors>("errors");
	}

	private get $fs(): IFileSystem {
		return this.$injector.resolve<IFileSystem>("fs");
	}

	private get $logger(): ILogger {
		return this.$injector.resolve<ILogger>("logger");
	}

	constructor(private $injector: IInjector) { }

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

	public getUserData(): IUserData {
		let data: IUserData;

		try {
			data = this.$fs.readJson(this.userFilePath);
		} catch (err) {
			this.$logger.trace("Error while getting current user info:");
			this.$logger.trace(err);
			this.$errors.failWithoutHelp("Not logged in.");
		}

		return data;
	}

	public setToken(token: ITokenData): void {
		if (token) {
			const newUserData = _.extend(this.getUserData(), token);
			this.setUserData(newUserData);
		} else {
			this.clearUserData();
		}
	}

	public setUserData(userData: IUserData): void {
		if (userData) {
			this.userData = userData;
			this.$fs.writeJson(this.userFilePath, userData);
		} else {
			this.userData = null;
			this.$fs.deleteFile(this.userFilePath);
		}
	}

	public clearUserData(): void {
		this.userData = null;
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
