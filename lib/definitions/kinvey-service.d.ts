/**
 * Describes service for working with Kinvey mBaaS.
 */
interface IKinveyService {
	/**
	 * Returns information for all applications of the current user.
	 * @returns {Promise<IKinveyApplication[]>}
	 */
	getApps(): Promise<IKinveyApplication[]>;

	/**
	 * Creates application in the account of the current user.
	 * @param input Input required to create application.
	 * @returns {Promise<IKinveyApplication>}
	 */
	createApp(input: ICreateKinveyAppInput): Promise<IKinveyApplication>;

	/**
	 * First this method creates identity store. Then it creates authentication service
	 * in this identity store. Then it sets the default authentication service in the provided environment
	 * to the newly created service.
	 * @param input Input required to create authentication service.
	 * @returns {Promise<IKinveyAuthService>}
	 */
	createAuthService(input: ICreateKinveyAuthService): Promise<IKinveyAuthService>;

	/**
	 * Updates the provided authentication service.
	 * @param input The id of the authentication service and full authentication service object.
	 * @returns {Promise<IKinveyAuthService>}
	 */
	updateAuthService(input: IUpdateKinveyAuthService): Promise<IKinveyAuthService>;

	/**
	 * Returns all authentication services which allow access to the provided environment.
	 * The result is grouped by the identity store id.
	 * @param input The environment id.
	 * @returns {Promise<IDictionary<IKinveyAuthService[]>>}
	 */
	getAuthServices(input: IEnvironmentId): Promise<IDictionary<IKinveyAuthService[]>>;

	/**
	 * Returns the default authentication service for the provided environment.
	 * @param input The environment id.
	 * @returns {Promise<IKinveyAuthService>}
	 */
	getDefaultAuthService(input: IEnvironmentId): Promise<IKinveyAuthService>;

	/**
	 * Changes the default authentication service in the provided environment.
	 * @param input Input required to change the default authentication service.
	 * @returns {Promise<IKinveyAuthService>}
	 */
	changeDefaultAuthService(input: IChangeDefaultKinveyAuthService): Promise<IKinveyAuthService>;
}
