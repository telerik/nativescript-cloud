import { join } from "path";
import { home } from "osenv";

export class UserService implements IUserService {
	private userData: IUserData;
	private userInfoDirectory: string;

	constructor(private $errors: IErrors,
		private $fs: IFileSystem,
		private $hostInfo: IHostInfo,
		private $logger: ILogger) {
		this.userInfoDirectory = join(this.$hostInfo.isWindows ? process.env.LocalAppData : join(home(), ".local", "share"),
			"Telerik",
			"NativeScript");
	}

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
		const filePath = this.getUserFilePath();
		let data: IUserData;

		try {
			data = this.$fs.readJson(filePath);
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
			this.$fs.writeJson(this.getUserFilePath(), userData);
		} else {
			this.userData = null;
			this.$fs.deleteFile(this.getUserFilePath());
		}
	}

	public clearUserData(): void {
		this.userData = null;
		this.$fs.deleteFile(this.getUserFilePath());
	}

	private getUserFilePath(): string {
		return join(this.userInfoDirectory, ".nativescript-user");
	}
}

$injector.register("userService", UserService);
