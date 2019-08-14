import { join } from "path";
import { home } from "osenv";

import { UserServiceBase } from "./user-service-base";

export class TelerikUserService extends UserServiceBase implements IUserService {
	constructor(private $hostInfo: IHostInfo,
		$injector: IInjector,
		$logger: ILogger,
		$fs: IFileSystem,
		$nsCloudErrorsService: IErrors) {
		super($injector, $logger, $fs, $nsCloudErrorsService);
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
