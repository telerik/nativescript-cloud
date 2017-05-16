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

### Module authenticationService
The `authenticationService` is used for authentication related operations (login, logout etc.). You can call the following methods </br>
* `login` - Starts localhost server on which the login response will be returned. After that opens the login url or emits it if the `options.skipUi` is true.
After successful login returns the user information.
</br>
Definition:

```TypeScript
/**
 * Opens login page and after successfull login saves the user information.
 * If options.skipUi is set to true the service will emit the login url with "loginUrl" event.
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

const authenticatioNService = tns.authenticationService;
authenticationService.on("loginUrl", url => {
	const isWin = /^win/.test(process.platform);
	const openCommand = isWin ? "start" : "open";
	childProcess.execSync(`${openCommand} ${url}`);
});

const loginOptions = { skipUi: true };
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

* `getCurrentUserTokenState` - Calls the server with the token of the user and returns the token state.
</br>

Definition:

```TypeScript
/**
 * Checks the token state of the current user.
 * @returns {Promise<ITokenState>} Returns the token state
 */
getCurrentUserTokenState(): Promise<ITokenState>;
```
</br>

Usage:
```JavaScript
const tns = require("nativescript");

tns.authenticationService
	.getCurrentUserTokenState()
	.then(tokenState => console.log(tokenState))
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

### Development
The project is written in TypeScript. After cloning it, you can set it up by executing the following commands in your terminal:
* `$ npm i --ignore-scripts` - NOTE: `--ignore-scripts` is a must.
* `$ npm i -g grunt-cli` (only in case you do not have it installed globally)
* `$ grunt test` (first execution of this command might take a little bit longer, consecutive calls will work much faster)

After that you can make changes in the code. In order to transpile them, just execute:
* `$ grunt`

You can pack a new version of the library by executing:
* `$ grunt pack`
