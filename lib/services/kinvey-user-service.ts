import { join } from "path";
import { home } from "osenv";

import { UserServiceBase } from "./user-service-base";

export class KinveyUserService extends UserServiceBase implements IUserService {
	constructor($injector: IInjector,
		private $hostInfo: IHostInfo) {
		super($injector);
		this.userFilePath = this.getUserFilePath();
	}

	public getUserData(): IUserData {
		const userData: IKinveyUserData = <any>super.getUserData();
		return {
			accessToken: userData.token,
			refreshToken: "",
			userInfo: {
				email: userData.email,
				firstName: userData.firstName,
				lastName: userData.lastName
			}
		};
	}

	public setUserData(userData: IUserData): void {
		const kinveyUserData: any = {
			email: userData.userInfo.email,
			firstName: userData.userInfo.firstName,
			lastName: userData.userInfo.lastName,
			token: userData.accessToken
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
