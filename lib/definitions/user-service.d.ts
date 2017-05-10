interface IUserService {
	hasUser(): boolean;
	getUser(): IUser;
	getUserData(): IUserData;
	setUserData(userData: IUserData): void;
	setToken(token: ITokenData): void;
	clearUserData(): void;
}
