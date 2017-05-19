# nativescript-cloud
Used for cloud support in NativeScript CLI

## Public API
This section describes all methods that can be invoked when you have installed the `nativescript-cloud` extension and NativeScript CLI is required as library, i.e.:
```JavaScript
const tns = require("nativescript");
```

### Module cloudBuildService
The `cloudBuildService` allows build of applications in the cloud. You can call the following methods:
* `build` method - it validates passed arguments and tries to build the application in the cloud. In case of successful build, the build result (.apk, .ipa or .zip) is downloaded. The result contains information about the whole build process, path to the downloaded build result and information used to generate a QR code, pointing to the latest build result (in S3). </br>
Definition:

```TypeScript
/**
 * Builds the specified application in the cloud and returns information about the whole build process.
 * @param {IProjectSettings} projectSettings Describes the current project - project dir, application identifier, name and nativescript data.
 * @param {string} platform The mobile platform for which the application should be built: Android or iOS.
 * @param {string} buildConfiguration The build configuration - Debug or Release.
 * @param {IAndroidBuildData} androidBuildData Android speicific information for the build.
 * @param {IIOSBuildData} iOSBuildData iOS speicific information for the build.
 * @returns {Promise<IBuildResultData>} Information about the build process. It is returned only on successfull build. In case the build fails, the Promise is rejected with the server information.
 */
build(projectSettings: IProjectSettings,
	platform: string, buildConfiguration: string,
	androidBuildData?: IAndroidBuildData,
	iOSBuildData?: IIOSBuildData): Promise<IBuildResultData>;
```
Detailed description of each parameter can be found [here](./lib/definitions/cloud-build-service.d.ts).
</br>
Usage:
```JavaScript
const tns = require("nativescript");
const fs = require("fs");
const path = require("path");
const packageJsonContent = JSON.parse(fs.readFileSync("./package.json", "utf8").toString());

const projectSettings = {
	projectDir: process.cwd(),
	projectId: packageJsonContent.nativescript.id,
	projectName: path.dirname(process.cwd()),
	nativeScriptData: packageJsonContent.nativescript
};

const androidReleaseConfigurationData = {
	pathToCertificate: "./myCertificate.p12",
	certificatePassword: "123456"
};

const platform = "android";
const buildConfiguration = "release";

tns.cloudBuildService
	.build(projectSettings, platform, buildConfiguration, androidReleaseConfigurationData)
	.then(buildResult => console.log(buildResult))
	.catch(err => console.error(err));
```

* `validateBuildProperties` - validates all properties required for specific platform. This includes a check if current application identifier matches the CodeSigning identity for iOS operations, a check if the specified device identifier (in case it is passed) is included in the mobile provision, validation of the password, etc.
</br>
Definition:

```TypeScript
/**
 * Validates the build properties for specified platform (Android or iOS).
 * The result promise is rejected with the error found. In case everything is correct, the promise is resolved.
 * @param {string} platform The mobile platform for which the application should be built: Android or iOS.
 * @param {string} buildConfiguration The build configuration - Debug or Release.
 * @param {string} projectId Application identifier of the project.
 * @param {IAndroidBuildData} androidBuildData Android speicific information for the build.
 * @param {IIOSBuildData} iOSBuildData iOS speicific information for the build.
 * @returns {Promise<void>}
 */
validateBuildProperties(platform: string,
	buildConfiguration: string,
	projectId: string,
	androidBuildData?: IAndroidBuildData,
	iOSBuildData?: IIOSBuildData): Promise<void>;
```
Detailed description of each parameter can be found [here](./lib/definitions/cloud-build-service.d.ts).
</br>
Usage:
```JavaScript
const tns = require("nativescript");
const fs = require("fs");
const path = require("path");
const packageJsonContent = JSON.parse(fs.readFileSync("./package.json", "utf8").toString());

const projectId = packageJsonContent.nativescript.id;

const androidReleaseConfigurationData = {
	pathToCertificate: "./myCertificate.p12",
	certificatePassword: "123456"
};

const platform = "android";
const buildConfiguration = "release";

tns.cloudBuildService
	.validateBuildProperties(platform, buildConfiguration, projectId, androidReleaseConfigurationData)
	.then(buildResult => console.log("Data is valid"))
	.catch(err => console.error("Data is invalid:", err));
```

### Module appetizeEmulatorLauncher
The `appetizeEmulatorLauncher` provides a way for initial interaction with appetize emulators. You can call the following methods:
* `startEmulator` method - starts an appetize emulator and returns a url where an html page is located, containing an iframe with the actual emulator. </br>
Definition:

```TypeScript
/**
 * Describes options that can be passed when starting an appetize emulator.
 */
interface IAppetizeEmulatorStartData {
	/**
	 * Path to the package file (.apk or .zip) to load - can either be a local path or a url.
	 */
	packageFile: string;
	/**
	 * Platform for the emulator - android or ios
	 */
	platform: string;
	/**
	 * Model of the emulator - for example nexus5, iphone5s, iphone6 - etc
	 */
	model: string;
}

/**
 * Describes service for initial interaction with appetize emulators.
 */
interface IAppetizeEmulatorLauncher {
	/**
	 * Starts an appetize emulator.
	 * @param {IAppetizeEmulatorStartData} data Options for starting emulator.
	 * @param optional {IConfigOptions} options The config options.
	 * @returns {string} A url containing an html page with the emulator inside an iframe. The url's host is localhost.
	 */
	startEmulator(data: IAppetizeEmulatorStartData): Promise<string>;
}

```
Usage:
```JavaScript
const tns = require("nativescript");

tns.appetizeEmulatorLauncher.startEmulator({
			packageFile: "test.apk",
			platform: "android",
			model: "nexus5"
		}).then(address => {
			console.log("address is", address);
			// http://localhost:56760/?publicKey=somekey&device=nexus5
		});
```

### Module authenticationService
The `authenticationService` is used for authentication related operations (login, logout etc.). You can call the following methods </br>
* `login` - Starts localhost server on which the login response will be returned. After that if there is `options.openAction` it will be used to open the login url. If this option is not defined the default opener will be used. After successful login returns the user information.
</br>
Definition:

```TypeScript
/**
 * Opens login page and after successfull login saves the user information.
 * If options.openAction is provided, it will be used to open the login url instead of the default opener.
 * @param {ILoginOptions} options Optional settings for the login method.
 * @returns {Promise<IUser>} Returns the user information after successful login.
 */
login(options?: ILoginOptions): Promise<IUser>;
```
Detailed description of each parameter can be found [here](./lib/definitions/authentication-service.d.ts).
</br>
Usage:
```JavaScript
const tns = require("nativescript");

tns.authenticationService
	.login()
	.then(userInfo => console.log(userInfo))
	.catch(err => console.error(err));
```

```JavaScript
const tns = require("nativescript");
const childProcess = require("child_process");

const openAction = url => {
		return new Promise((resolve, reject) => {
			const isWin = /^win/.test(process.platform);
			const openCommand = isWin ? "start" : "open";
			childProcess.exec(`${openCommand} ${url}`, (err, result) => err ? reject(err) : resolve(result));
		});
	};
const loginOptions = { openAction: openAction };

tns.authenticationService
	.login(loginOptions)
	.then(userInfo => console.log(userInfo))
	.catch(err => console.error(err));
```

* `logout` - Invalidates the current user authentication data.
</br>
Definition:

```TypeScript
/**
 * Invalidates the current user authentication data.
 * @returns {void}
 */
logout(): void;
```
</br>
Usage:

```JavaScript
const tns = require("nativescript");

tns.authenticationService.logout();
```

* `isUserLoggedIn` - Checks if the access token of the current user is valid. If it is - the method will return true. If it isn't - the method will try to issue new access token. If the method can't issue new token it will return false.
</br>

Definition:

```TypeScript
/**
 * CheChecks if there is user info and the access token of the current user is valid. The method will try to issue new access token if the current is not valid.
 * @returns {Promise<boolean>} Returns true if the user is logged in.
 */
isUserLoggedIn(): Promise<boolean>;
```
</br>

Usage:
```JavaScript
const tns = require("nativescript");

tns.authenticationService
	.isUserLoggedIn()
	.then(isLoggedIn => console.log(isLoggedIn))
	.catch(err => console.error(err));
```

* `refreshCurrentUserToken` - Uses the refresh token of the current user to issue new access token.
</br>

Definition:

```TypeScript
/**
 * Uses the refresh token of the current user to issue new access token.
 */
refreshCurrentUserToken(): Promise<void>;
```
</br>

Usage:
```JavaScript
const tns = require("nativescript");

tns.authenticationService.refreshCurrentUserToken()
	.then(() => console.log("Success"))
	.catch(err => console.error(err));
```

#### Interfaces:
```TypeScript
interface IUser {
	email: string;
	firstName: string;
	lastName: string;
}

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
	 * Action which will be used to open the login url.
	 */
	openAction?: (loginUrl: string) => Promise<void>;

	/**
	 * Sets the ammount of time which the login method will wait for login response in non-interactive terminal.
	 */
	timeout?: string;
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
```

### Module userService
The `userService` is used to get information aboud the current user or modify it. You can call the following methods </br>
* `hasUser` - Checks if there is user information.
</br>
Definition:

```TypeScript
/**
 * Checks if there is user information.
 * @returns {boolean} Returns true if there is user information.
 */
hasUser(): boolean;
```
</br>
Usage:

```JavaScript
const tns = require("nativescript");

const hasUser = tns.userService.hasUser();
console.log(hasUser);
```

* `getUser` - Returns the current user information.
</br>
Definition:

```TypeScript
/**
 * Returns the current user information.
 * @returns {IUser} The current user information.
 */
getUser(): IUser;
```
</br>
Usage:

```JavaScript
const tns = require("nativescript");

const user = tns.userService.getUser();
console.log(user);
```

Sample result for `user` will be:
```JSON
{
	"email": "some@mail.com",
	"firstName": "First",
	"lastName": "Last"
}
```

* `getUserData` - Returns the user information and the authentication data for the current user.
</br>

Definition:

```TypeScript
/**
 * Returns the user information and the authentication data for the current user.
 * @returns {IUserData} The user information and the authentication data for the current user.
 */
getUserData(): IUserData;
```
</br>

Usage:
```JavaScript
const tns = require("nativescript");

const userData = tns.userService.getUserData();
console.log(userData);
```

Sample result for `userData` will be:
```JSON
{
	"accessToken": "some token",
	"refreshToken": "some refresh token",
	"userInfo": {
		"email": "some@mail.com",
		"firstName": "First",
		"lastName": "Last"
	}
}
```

* `setUserData` - Sets the user information and the authentication data for the current user.
</br>

Definition:

```TypeScript
/**
 * Sets the user information and the authentication data for the current user.
 * @param {IUserdata} userData The user data to set.
 * @returns {void}
 */
setUserData(userData: IUserData): void;
```
Detailed description of each parameter can be found [here](./lib/definitions/user-service.d.ts).
</br>

Usage:
```JavaScript
const tns = require("nativescript");

const userData = {
	accessToken: "some token",
	refreshToken: "some refresh token",
	userInfo: {
		email: "some@mail.bg",
		firstName: "First",
		lastName: "Last"
	}
};

tns.userService.setUserData(userData);
```

* `setToken` - Sets only the token of the current user.
</br>

Definition:

```TypeScript
/**
 * Sets only the token of the current user.
 * @param {ITokenData} token The token data.
 * @returns void
 */
setToken(token: ITokenData): void;
```
Detailed description of each parameter can be found [here](./lib/definitions/user-service.d.ts).
</br>

Usage:
```JavaScript
const tns = require("nativescript");

const token = {
	accessToken: "some token"
};

tns.userService.setToken(token);
```

* `clearUserData` - Removes the current user data.
</br>

Definition:

```TypeScript
/**
 * Removes the current user data.
 */
clearUserData(): void;
```
</br>

Usage:
```JavaScript
const tns = require("nativescript");

tns.userService.clearUserData();
```

#### Interfaces:
```TypeScript
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
```

### Development
The project is written in TypeScript. After cloning it, you can set it up by executing the following commands in your terminal:
* `$ npm i --ignore-scripts` - NOTE: `--ignore-scripts` is a must.
* `$ npm i -g grunt-cli` (only in case you do not have it installed globally)
* `$ grunt test` (first execution of this command might take a little bit longer, consecutive calls will work much faster)

After that you can make changes in the code. In order to transpile them, just execute:
* `$ grunt`

You can pack a new version of the library by executing:
* `$ grunt pack`
