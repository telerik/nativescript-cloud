interface IServerAuthService {
	devLogin(username: string, password: string): Promise<IUserData>;
	getLoginUrl(port: number): string;
	refreshToken(refreshToken: string): Promise<ITokenData>;
	getTokenState(token: string): Promise<ITokenState>;
	getLogoutUrl(): string;
}

interface ITokenState {
	/**
	 * True if the access token is valid.
	 */
	isTokenValid: boolean;

	/**
	 * The expiration timestamp. (1494.923982727)
	 */
	expirationTimestamp: number;
}
