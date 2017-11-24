import { HTTP_STATUS_CODES } from "../../constants";

export class ServerRequestService implements IServerRequestService {
	constructor(private $nsCloudAuthenticationService: IAuthenticationService,
		private $nsCloudServerServicesProxy: IServerServicesProxy,
		private $logger: ILogger) { }

	public async call<T>(options: ICloudRequestOptions): Promise<T> {
		try {
			// Try to send the request.
			return await this.$nsCloudServerServicesProxy.call<T>(options);
		} catch (requestError) {
			// If the server returns 401 we must try to get new access token using the refresh token and retry the request.
			if (requestError.response && requestError.response.statusCode === HTTP_STATUS_CODES.UNAUTHORIZED) {
				this.$logger.trace("Access token expired. Trying to issue a new one.");
				try {
					await this.$nsCloudAuthenticationService.refreshCurrentUserToken();
					return this.$nsCloudServerServicesProxy.call<T>(options);
				} catch (refreshTokenError) {
					this.$logger.trace("Cannot issue new access token. Reason is:");
					this.$logger.trace(refreshTokenError);
					const error = new Error("User is not logged in or the access token and the refresh tokens are expired.");
					error.code = HTTP_STATUS_CODES.UNAUTHORIZED;
					throw error;
				}
			} else {
				throw requestError;
			}
		}
	}
}

$injector.register("nsCloudServerRequestService", ServerRequestService);
