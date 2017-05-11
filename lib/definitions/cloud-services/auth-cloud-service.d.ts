interface ICloudAuthService {
	devLogin(username: string, password: string): Promise<IUserData>;
	getLoginUrl(port: number): string;
	refreshToken(refreshToken: string): Promise<ITokenData>;
	getTokenState(token: string): Promise<ITokenState>;
}

interface ITokenState {
	isTokenValid: boolean;
}
