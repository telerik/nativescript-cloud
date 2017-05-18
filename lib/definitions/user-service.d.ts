interface IUserService {
	/**
	 * Checks if there is user information.
	 * @returns {boolean} Returns true if there is user information.
	 */
	hasUser(): boolean;

	/**
	 * Returns the current user information.
	 * @returns {IUser} The current user information.
	 */
	getUser(): IUser;

	/**
	 * Returns the user information and the authentication data for the current user.
	 * @returns {IUserData} The user information and the authentication data for the current user.
	 */
	getUserData(): IUserData;

	/**
	 * Sets the user information and the authentication data for the current user.
	 * @param {IUserdata} userData The user data to set.
	 * @returns {void}
	 */
	setUserData(userData: IUserData): void;

	/**
	 * Sets only the token of the current user.
	 * @param {ITokenData} token The token data.
	 * @returns void
	 */
	setToken(token: ITokenData): void;

	/**
	 * Removes the current user data.
	 */
	clearUserData(): void;
}
