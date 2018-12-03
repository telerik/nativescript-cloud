export class UserService implements IUserService {
	private userService: IUserService;

	constructor(private $injector: IInjector,
		private $nsCloudServerConfigManager: IServerConfigManager) {
		this.userService = this.determineUserService();
	}

	public hasUser(): boolean {
		return this.userService.hasUser();
	}

	public getUser(): IUser {
		return this.userService.getUser();
	}

	public getUserData(): IUserData {
		return this.userService.getUserData();
	}

	public setToken(token: ITokenData): void {
		return this.userService.setToken(token);
	}

	public setUserData(userData: IUserData): void {
		return this.userService.setUserData(userData);
	}

	public clearUserData(): void {
		this.userService.clearUserData();
	}

	public async getUserAvatar(): Promise<string> {
		return this.userService.getUserAvatar();
	}

	private determineUserService(): IUserService {
		const serverConfig = this.$nsCloudServerConfigManager.getCurrentConfigData();
		const namespace = <string>serverConfig["namespace"];
		if (namespace && namespace.toLowerCase() === "kinvey") {
			return this.$injector.resolve<IUserService>("nsCloudKinveyUserService");
		}

		return this.$injector.resolve<IUserService>("nsCloudTelerikUserService");
	}
}

$injector.register("nsCloudUserService", UserService);
