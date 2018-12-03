import { join } from "path";
import { home } from "osenv";

import { UserServiceBase } from "./user-service-base";

export class TelerikUserService extends UserServiceBase implements IUserService {
	constructor($injector: IInjector,
		private $hostInfo: IHostInfo) {
		super($injector);
		this.userFilePath = this.getUserFilePath();
	}

	private getUserFilePath(): string {
		return join(this.$hostInfo.isWindows ? process.env.LocalAppData : join(home(), ".local", "share"),
		"Telerik",
		"NativeScript",
		".nativescript-user");
	}
}

$injector.register("nsCloudTelerikUserService", TelerikUserService);
