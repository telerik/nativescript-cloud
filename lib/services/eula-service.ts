export class EulaConstants {
	public static eulaUrl = "https://www.nativescript.org/nativescript-sidekick/eula";
	public static acceptedEulaHashKey = "acceptedEulaHash";
	public static timeout = 60000;
	public static eulaStates = {
		accept: "Accept",
		decline: "Decline"
	};
}

import { getHash } from "../helpers";
export class EulaService implements IEulaService {
	constructor(private $httpClient: Server.IHttpClient,
		private $userSettingsService: IUserSettingsService) {

	}

	public async shouldAcceptEula(): Promise<boolean> {
		// TODO: Add timeout
		const response = await this.$httpClient.httpRequest("https://www.nativescript.org/nativescript-sidekick/eula");

		const acceptedEulaHash = await this.$userSettingsService.getSettingValue<string>(EulaConstants.acceptedEulaHashKey);

		console.log(response.body.length); // 275887        // 275888
		const currentEulaHash = getHash(response.body);
		console.log("current hash: ".red, currentEulaHash);
		console.log("acceptedEulaHash hash: ".green, acceptedEulaHash);
		/*
		275888
		current hash:  6cafed0e6f0f8d8c3cee6461fe7ff43c9b6c3f6339233ac5df1056eeeb84d93a
		acceptedEulaHash hash:  6cafed0e6f0f8d8c3cee6461fe7ff43c9b6c3f6339233ac5df1056eeeb84d93a

		275887
		current hash:  8f861f6e73089554e00842b69a18ad7009c7e6fc5a094b1eec6e652e21be42b4
		acceptedEulaHash hash:  6cafed0e6f0f8d8c3cee6461fe7ff43c9b6c3f6339233ac5df1056eeeb84d93a

		*/
		const shouldAcceptEula = currentEulaHash !== acceptedEulaHash;

		return shouldAcceptEula;
	}

	public async acceptEula(): Promise<void> {
		const response = await this.$httpClient.httpRequest("https://www.nativescript.org/nativescript-sidekick/eula");

		const currentEulaHash = getHash(response.body);
		await this.$userSettingsService.saveSetting<string>(EulaConstants.acceptedEulaHashKey, currentEulaHash);
	}
}

$injector.register("nsCloudEulaService", EulaService);
