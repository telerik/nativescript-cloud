import { EventEmitter } from "events";
import { ServerRequest, ServerResponse } from "http";
import { parse } from "url";
import { join } from "path";
import { AUTH_EVENT_NAMES } from "../constants";
import { isInteractive } from "../helpers";

export class AuthenticationService extends EventEmitter implements IAuthenticationService {
	private static DEFAULT_NONINTERACTIVE_LOGIN_TIMEOUT_MS: number = 15 * 60 * 1000;

	constructor(private $authCloudService: ICloudAuthService,
		private $fs: IFileSystem,
		private $httpServer: IHttpServer,
		private $logger: ILogger,
		private $opener: IOpener,
		private $userService: IUserService) {
		super();
	}

	public async login(options?: ILoginOptions): Promise<IUser> {
		// Start the localhost server to wait for the login response.
		let timeoutID: NodeJS.Timer | number = undefined;
		let authCompleteResolveAction: (value?: any | PromiseLike<any>) => void;
		let isResolved = false;

		this.$logger.info("Launching login page in browser.");

		let loginUrl: string;
		let localhostServer = this.$httpServer.createServer({
			routes: {
				"/": async (request: ServerRequest, response: ServerResponse) => {
					this.$logger.debug("Login complete: " + request.url);
					let parsedUrl = parse(request.url, true);
					let loginResponse = parsedUrl.query.response;
					if (loginResponse) {
						await this.serveLoginFile("end.html")(request, response);
						localhostServer.close();

						isResolved = true;

						const decodedResponse = new Buffer(loginResponse, "base64").toString();
						authCompleteResolveAction(decodedResponse);
					} else {
						this.$httpServer.redirect(response, loginUrl);
					}
				}
			}
		});

		localhostServer.listen(0);

		await this.$fs.futureFromEvent(localhostServer, "listening");

		const authComplete = new Promise<string>((resolve, reject) => {
			authCompleteResolveAction = resolve;

			const port = localhostServer.address().port;

			loginUrl = this.$authCloudService.getLoginUrl(port);

			this.$logger.debug("Login URL is '%s'", loginUrl);

			this.emit(AUTH_EVENT_NAMES.LOGIN_URL, loginUrl);
			if (!options.skipUi) {
				this.$opener.open(loginUrl);
			}

			if (!isInteractive()) {
				let timeout = options.hasOwnProperty("timeout")
					? + options.timeout
					: AuthenticationService.DEFAULT_NONINTERACTIVE_LOGIN_TIMEOUT_MS;

				if (timeout > 0) {
					timeoutID = setTimeout(() => {
						if (!isResolved) {
							this.$logger.debug("Aborting login procedure due to inactivity.");
							process.exit();
						}
					}, timeout);
				}
			}
		});

		const loginResponse = await authComplete;

		if (timeoutID !== undefined) {
			clearTimeout(<NodeJS.Timer>timeoutID);
		}

		let userData: IUserData = JSON.parse(loginResponse);
		this.$userService.setUserData(userData);

		let userInfo = userData.userInfo;
		this.emit(AUTH_EVENT_NAMES.LOGIN_COMPLETE, userInfo);

		return userInfo;
	}

	public async devLogin(username: string, password: string): Promise<IUser> {
		const userData = await this.$authCloudService.devLogin(username, password);
		this.$userService.setUserData(userData);

		return userData.userInfo;
	}

	public logout(): void {
		this.$userService.clearUserData();
	}

	public async refreshCurrentUserToken(): Promise<void> {
		const userData = this.$userService.getUserData();
		const token = await this.$authCloudService.refreshToken(userData.refresnToken);
		this.$userService.setToken(token);
	}

	public async getCurrentUserTokenState(): Promise<ITokenState> {
		const userData = this.$userService.getUserData();
		const tokenState = await this.$authCloudService.getTokenState(userData.accessToken);
		return tokenState;
	}

	private serveLoginFile(relPath: string): (request: ServerRequest, response: ServerResponse) => Promise<void> {
		return this.$httpServer.serveFile(join(__dirname, "..", "..", "resources", "login", relPath));
	}
}

$injector.register("authenticationService", AuthenticationService);
