import { join } from "path";
import { home } from "osenv";

import { UserServiceBase } from "./user-service-base";

export class KinveyUserService extends UserServiceBase implements IUserService {
	constructor(private $hostInfo: IHostInfo,
		$injector: IInjector,
		$logger: ILogger,
		$fs: IFileSystem,
		$errors: IErrors) {
		super($injector, $logger, $fs, $errors);
		this.userFilePath = this.getUserFilePath();
	}

	public getUserData(): IUserData {
		const userData: IKinveyUserData = super.getUserData();
		return {
			accessToken: userData.token,
			refreshToken: "",
			instanceId: userData.instanceId,
			userInfo: {
				email: userData.email,
				firstName: userData.firstName,
				lastName: userData.lastName
			}
		};
	}

	public setUserData(userData: IUserData): void {
		const kinveyUserData: IKinveyUserData = {
			email: userData.userInfo.email,
			firstName: userData.userInfo.firstName,
			lastName: userData.userInfo.lastName,
			token: userData.accessToken,
			instanceId: userData.instanceId
		};

		super.setUserData(kinveyUserData);
	}

	private getUserFilePath(): string {
		return join(this.$hostInfo.isWindows ? join(process.env.AppData) : join(home(), ".local", "share"),
			"KinveyStudio",
			"kinveyUser.json");
	}
}

$injector.register("nsCloudKinveyUserService", KinveyUserService);
