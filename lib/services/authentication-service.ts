import { ServerRequest, ServerResponse, Server } from "http";
import { parse } from "url";
import { isInteractive } from "../helpers";
import { HTTP_HEADERS, HTTP_STATUS_CODES } from "../constants";

export class AuthenticationService implements IAuthenticationService {
	private static DEFAULT_NONINTERACTIVE_LOGIN_TIMEOUT_MS: number = 15 * 60 * 1000;
	private localhostServer: Server;
	private rejectLoginPromiseAction: (data: any) => void;

	constructor(private $authCloudService: IAuthCloudService,
		private $fs: IFileSystem,
		private $httpServer: IHttpServer,
		private $logger: ILogger,
		private $opener: IOpener,
		private $userService: IUserService) { }

	public async login(options?: ILoginOptions): Promise<IUser> {
		options = options || {};

		if (this.localhostServer) {
			this.cancelLogin();
		}

		// Start the localhost server to wait for the login response.
		let timeoutID: NodeJS.Timer | number = undefined;
		let authCompleteResolveAction: (value?: any | PromiseLike<any>) => void;
		let isResolved = false;

		this.$logger.info("Launching login page in browser.");

		let loginUrl: string;
		this.localhostServer = this.$httpServer.createServer({
			routes: {
				"/": (request: ServerRequest, response: ServerResponse) => {
					this.$logger.debug("Login complete: " + request.url);
					const parsedUrl = parse(request.url, true);
					const loginResponse = parsedUrl.query.response;
					if (loginResponse) {
						response.statusCode = HTTP_STATUS_CODES.FOUND;
						response.setHeader(HTTP_HEADERS.LOCATION, parsedUrl.query.loginCompleteUrl);
						this.killLocalhostServer();

						isResolved = true;

						const decodedResponse = new Buffer(loginResponse, "base64").toString();
						this.rejectLoginPromiseAction = null;
						authCompleteResolveAction(decodedResponse);
						response.end();
					} else {
						this.$httpServer.redirect(response, loginUrl);
					}
				}
			}
		});

		this.localhostServer.listen(0);

		await this.$fs.futureFromEvent(this.localhostServer, "listening");

		const authComplete = new Promise<string>((resolve, reject) => {
			authCompleteResolveAction = resolve;
			this.rejectLoginPromiseAction = reject;

			const port = this.localhostServer.address().port;

			loginUrl = this.$authCloudService.getLoginUrl(port);

			this.$logger.debug("Login URL is '%s'", loginUrl);

			if (!options.openAction) {
				this.$opener.open(loginUrl);
			} else {
				options.openAction(loginUrl);
			}

			if (!isInteractive()) {
				const timeout = options.hasOwnProperty("timeout")
					? + options.timeout
					: AuthenticationService.DEFAULT_NONINTERACTIVE_LOGIN_TIMEOUT_MS;

				if (timeout > 0) {
					timeoutID = setTimeout(() => {
						if (!isResolved) {
							this.$logger.debug("Aborting login procedure due to inactivity.");
							reject(new Error("Aborting login procedure due to inactivity."));
						}
					}, timeout);
				}
			}
		});

		const loginResponse = await authComplete;

		if (timeoutID !== undefined) {
			clearTimeout(<NodeJS.Timer>timeoutID);
		}

		const userData: IUserData = JSON.parse(loginResponse);
		this.$userService.setUserData(userData);

		const userInfo = userData.userInfo;

		return userInfo;
	}

	public async devLogin(username: string, password: string): Promise<IUser> {
		const userData = await this.$authCloudService.devLogin(username, password);
		this.$userService.setUserData(userData);

		return userData.userInfo;
	}

	public cancelLogin(): void {
		this.$logger.trace("Cancel login.");
		if (this.localhostServer) {
			this.$logger.trace("Stopping localhost server.");
			this.killLocalhostServer();
		}

		if (this.rejectLoginPromiseAction) {
			this.$logger.trace("Rejecting login promise.");
			this.rejectLoginPromiseAction(new Error("Login canceled."));
			this.rejectLoginPromiseAction = null;
		}
	}

	public logout(options?: IOpenActionOptions): void {
		options = options || {};

		const logoutUrl = this.$authCloudService.getLogoutUrl();
		this.$logger.trace(`Logging out. Logout url is: ${logoutUrl}`);

		if (options.openAction) {
			options.openAction(logoutUrl);
		} else {
			this.$opener.open(logoutUrl);
		}

		this.$userService.clearUserData();
	}

	public async refreshCurrentUserToken(): Promise<void> {
		const userData = this.$userService.getUserData();
		const token = await this.$authCloudService.refreshToken(userData.refresnToken);
		this.$userService.setToken(token);
	}

	public async isUserLoggedIn(): Promise<boolean> {
		if (this.$userService.hasUser()) {
			const tokenState = await this.getCurrentUserTokenState();
			if (tokenState.isTokenValid) {
				return true;
			}

			try {
				this.$logger.trace("The access token of the user has expired. Trying to issue new one.");
				await this.refreshCurrentUserToken();

				// We don't want to check the state of the new access token because it will be valid.
				return true;
			} catch (err) {
				this.$logger.trace("Error while trying to issue new access token:");
				this.$logger.trace(err);
			}
		}

		return false;
	}

	private async getCurrentUserTokenState(): Promise<ITokenState> {
		const userData = this.$userService.getUserData();
		const tokenState = await this.$authCloudService.getTokenState(userData.accessToken);
		return tokenState;
	}

	private killLocalhostServer(): void {
		this.localhostServer.close();
		this.localhostServer = null;
	}
}

$injector.register("authenticationService", AuthenticationService);
