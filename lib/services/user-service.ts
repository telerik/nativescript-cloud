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
		return this.readAndCache(this.getUserFilePath(),
			() => this.userData && this.userData.userInfo,
			this.setUserDataCallback.bind(this));
	}

	public getUserData(): IUserData {
		return this.readAndCache(this.getUserFilePath(),
			() => this.userData,
			this.setUserDataCallback.bind(this));
	}

	public setToken(token: ITokenData): void {
		if (!token) {
			const newUserData = _.extend(token, this.getUserData());
			this.setUserData(newUserData);
			this.$fs.writeJson(this.getUserFilePath(), newUserData);
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

	private readAndCache<T>(sourceFile: string, getter: () => T, setter: (value: string) => void): T {
		if (!getter()) {
			let contents: any;
			try {
				contents = this.$fs.readText(sourceFile);
				setter(contents);
			} catch (err) {
				this.$logger.debug("Error while reading user data file '%s':\n%s\n\nContents:\n%s",
					sourceFile,
					err.toString(),
					contents);
				this.clearUserData();
				this.$errors.failWithoutHelp("Not logged in.");
			}
		}

		return getter();
	}

	private setUserDataCallback(value: string): void {
		const userData: IUserData = JSON.parse(value);
		this.userData = userData;
	}

	private getUserFilePath(): string {
		return join(this.userInfoDirectory, ".nativescript-user");
	}
}

$injector.register("userService", UserService);
