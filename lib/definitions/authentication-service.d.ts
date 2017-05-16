interface IAuthenticationService {
	/**
	 * Uses username and password for login and after successfull login saves the user information.
	 * @param {string} username The username of the user.
	 * @param {string} password The password of the user.
	 * @returns {Promise<IUser>} Returns the user information after successful login.
	 */
	devLogin(username: string, password: string): Promise<IUser>;

	/**
	 * Opens login page and after successfull login saves the user information.
	 * If options.skipUi is set to true the service will emit the login url with "loginUrl" event.
	 * @param {ILoginOptions} options Optional settings for the login method.
	 * @returns {Promise<IUser>} Returns the user information after successful login.
	 */
	login(options?: ILoginOptions): Promise<IUser>;

	/**
	 * Invalidates the current user authentication data.
	 * @returns {void}
	 */
	logout(): void;

	/**
	 * Uses the refresh token of the current user to issue new access token.
	 */
	refreshCurrentUserToken(): Promise<void>;

	/**
	 * Checks the token state of the current user.
	 * @returns {Promise<ITokenState>} Returns the token state
	 */
	getCurrentUserTokenState(): Promise<ITokenState>;
}

interface ILoginOptions {
	/**
	 * If true the login method will emit the login url instead of opening it in the browser.
	 */
	skipUi?: boolean;

	/**
	 * Sets the ammount of time which the login method will wait for login response in non-interactive terminal.
	 */
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
