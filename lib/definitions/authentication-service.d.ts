interface IAuthenticationService {
	devLogin(username: string, password: string): Promise<IUser>;
	login(options?: ILoginOptions): Promise<IUser>;
	logout(): void;
	refreshToken(): Promise<void>;
	getTokenState(): Promise<ITokenState>;
}

interface ILoginOptions {
	skipUi?: boolean;
	timeout?: string;
}

interface IUserData extends ITokenData {
	refresnToken: string;
	userInfo: IUser;
}

interface ITokenData {
	accessToken: string;
}

interface IUser {
	email: string;
	firstName: string;
	lastName: string;
}
