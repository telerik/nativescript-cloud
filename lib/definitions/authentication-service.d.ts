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
	 * If options.openAction is provided, it will be used to open the login url instead of the default opener.
	 * @param {ILoginOptions} options Optional settings for the login method.
	 * @returns {Promise<IUser>} Returns the user information after successful login.
	 */
	login(options?: ILoginOptions): Promise<IUser>;

	/**
	 * Invalidates the current user authentication data.
	 * If options.openAction is provided, it will be used to open the logout url instead of the default opener.
	 * @param {IOpenActionOptions} options Optional settings for the logout method.
	 * @returns {void}
	 */
	logout(options?: IOpenActionOptions): void;

	/**
	 * Uses the refresh token of the current user to issue new access token.
	 */
	refreshCurrentUserToken(): Promise<void>;

	/**
	 * Checks if there is user info and the access token of the current user is valid. The method will try to issue new access token if the current is not valid.
	 * @returns {Promise<boolean>} Returns true if the user is logged in.
	 */
	isUserLoggedIn(): Promise<boolean>;

	/**
	 * Stops the current login process and rejects the login promise with an error.
	 * @returns {void}
	 */
	cancelLogin(): void;
}

interface IOpenActionOptions {
	/**
	 * Action which will receive url and decide how to open it.
	 */
	openAction?: (url: string) => void;
}

interface ILoginOptions extends IOpenActionOptions {
	/**
	 * Sets the ammount of time which the login method will wait for login response in non-interactive terminal.
	 */
	timeout?: string;
}

interface IUserData extends ITokenData {
	refreshToken: string;
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
