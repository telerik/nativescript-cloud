# nativescript-cloud
Used for cloud support in NativeScript CLI

# Contents
* [Public API](#public-api)
* [Development](#development)

## Public API
This section describes all methods that can be invoked when you have installed the `nativescript-cloud` extension and NativeScript CLI is required as library, i.e.:
```JavaScript
const tns = require("nativescript");
```

## Contents
* [nsCloudBuildService](#nscloudbuildservice)
  * [build](#build-method)
  * [Events](#nscloudbuildservice-events)
    * [buildOutput](#buildoutput)
    * [stepChanged](#stepchanged)
    * [Events usage](#events-usage)
  * [validateBuildProperties](#validatebuildproperties)
  * [getBuildOutputDirectory](#getbuildoutputdirectory)
* [nsCloudCodesignService](#nscloudcodesignservice)
  * [generateCodesignFiles](#generatecodesignfiles)
  * [getServerOperationOutputDirectory](#getserveroperationoutputdirectory)
* [nsCloudPublishService](#nscloudpublishservice)
  * [publishToItunesConnect](#publishtoitunesconnect)
  * [publishToGooglePlay](#publishtogoogleplay)
* [nsCloudApplicationService](#nscloudapplicationservice)
  * [shouldBuild](#shouldbuild)
  * [shouldInstall](#shouldinstall)
* [nsCloudEmulatorLauncher](#nscloudemulatorlauncher)
  * [login](#login)
  * [logout](#logout)
  * [isUserLoggedIn](#isuserloggedin)
  * [refreshCurrentUserToken](#refreshcurrentusertoken)
  * [cancelLogin](#cancellogin)
  * [Interfaces describing returned information](#interfaces)
* [nsCloudUserService](#nsclouduserservice)
  * [hasUser](#hasuser)
  * [getUser](#getuser)
  * [getUserData](#getuserdata)
  * [setUserData](#setuserdata)
  * [setToken](#settoken)
  * [clearUserData](#clearuserdata)
  * [getUserAvatar](#getuseravatar)
* [nsCloudAccountsService](#nscloudaccountsservice)
  * [getMyAccounts](#getmyaccounts)
  * [getUsageInfo](#getusageinfo)
* [nsCloudEulaService](#nscloudeulaservice)
  * [getEulaData](#geteuladata)
  * [getEulaDataWithCache](#geteuladatawithcache)
  * [acceptEula](#acceptEula)

### nsCloudBuildService
The `nsCloudBuildService` allows build of applications in the cloud. You can call the following methods:

#### build method
`build` method validates passed arguments and tries to build the application in the cloud. In case of successful build, the build result (.apk, .ipa or .zip) is downloaded. The result contains information about the whole build process, path to the downloaded build result and information used to generate a QR code, pointing to the latest build result (in S3). </br>
Definition:

```TypeScript
/**
 * Builds the specified application in the cloud and returns information about the whole build process.
 * @param {IProjectSettings} projectSettings Describes the current project - project dir, application identifier, name and nativescript data.
 * @param {string} platform The mobile platform for which the application should be built: Android or iOS.
 * @param {string} buildConfiguration The build configuration - Debug or Release.
 * @param {string} accountId the account which will be charged for the build.
 * @param {IAndroidBuildData} androidBuildData Android specific information for the build.
 * @param {IIOSBuildData} iOSBuildData iOS specific information for the build.
 * @returns {Promise<IBuildResultData>} Information about the build process. It is returned only on successful build. In case the build fails, the Promise is rejected with the server information.
 */
build(projectSettings: IProjectSettings,
	platform: string,
	buildConfiguration: string,
	accountId: string,
	androidBuildData?: IAndroidBuildData,
	iOSBuildData?: IIOSBuildData): Promise<IBuildResultData>;
```
Detailed description of each parameter can be found [here](./lib/definitions/cloud-build-service.d.ts).
</br>

#### nsCloudBuildService events
`nsCloudBuildService` raises the following events:

##### buildOutput
`buildOutput` event contains parts of the current build output:
```TypeScript
interface IBuildLog {
	buildId: string;
	data: string;
	pipe: string;
}
```
##### stepChanged
`stepChanged` event contains the name of the changed build step and its progress:
```TypeScript
/**
* Describes build step.
*/
interface IBuildStep {
	/**
	* The ID of the build.
	*/
	buildId: string;

	/**
	* The name of the step - prepare, upload, build or download.
	*/
	step: string;

	/**
	* The progress of the step in percents. The value will be between 0 and 100.
	*/
	progress: number;
}
```

##### Events usage
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

tns.nsCloudBuildService.on("buildOutput", (data) => {
	console.log(data);
	/*
		Sample data object:
		{
			"buildId": "2fb2e19c-3720-4fd1-9446-1df98f5e3531",
			"pipe": "stdout",
			"data": "Add platform ios with runtime version 2.5.*"
		}
	*/
});

tns.nsCloudBuildService.on("stepChanged", (data) => {
	console.log(data);
	/*
		Sample data object:
		{
			"buildId": "2fb2e19c-3720-4fd1-9446-1df98f5e3531",
			"step": "build";
			"progress": 100;
		}
	*/
});

const accountId = "d0ce3ac0-36c2-427f-8d27-955915ffe189";

tns.nsCloudBuildService
	.build(projectSettings, platform, buildConfiguration, accountId, androidReleaseConfigurationData)
	.then(buildResult => console.log(buildResult))
	.catch(err => console.error(err));
```

#### validateBuildProperties
`validateBuildProperties` method validates all properties required for specific platform. This includes a check if current application identifier matches the CodeSigning identity for iOS operations, a check if the specified device identifier (in case it is passed) is included in the mobile provision, validation of the password, etc.
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

tns.nsCloudBuildService
	.validateBuildProperties(platform, buildConfiguration, projectId, androidReleaseConfigurationData)
	.then(buildResult => console.log("Data is valid"))
	.catch(err => console.error("Data is invalid:", err));
```

#### getBuildOutputDirectory
`getBuildOutputDirectory` - Returns the path to the directory where the build output may be found.
> This method is currently available only for backwards compatibility. The module now implements base module for server operations that exposes same functionality with more generic method:
> `getServerOperationOutputDirectory`. Detailed description of the parameter can be found [here](./lib/definitions/cloud-service.d.ts).
</br>
Definition:

```TypeScript
/**
 * Returns the path to the directory where the build output may be found.
 * @param {ICloudBuildOutputDirectoryOptions} options Options that are used to determine the build output directory.
 * @returns {string} The build output directory.
 */
getBuildOutputDirectory(options: ICloudBuildOutputDirectoryOptions): string;
```
Detailed description of the parameter can be found [here](./lib/definitions/cloud-build-service.d.ts).
</br>
Usage:
```JavaScript
const tns = require("nativescript");
const cloudBuildOutputDirectory = tns.nsCloudBuildService
			.getBuildOutputDirectory({
				platform: "ios",
				projectDir: "/tmp/myProject"
				emulator: false
			});
```

### nsCloudCodesignService
The `nsCloudCodesignService` allows generation of codesign files (currently only iOS .p12 and .mobileprovision) in the cloud. You can call the following methods:

#### generateCodesignFiles
`generateCodesignFiles` method validates passed arguments and tries to generate codesign files in the cloud. In case of success, the result files (.p12 and/or .mobileprovision) are downloaded. The result contains information about errors, if any, and path to the downloaded codesign files (in S3). </br>
Definition:

```TypeScript
/**
 * Generates codesign files in the cloud and returns s3 urls to certificate or/and provision.
 * @param {ICodesignData} codesignData Apple speicific information.
 * @param {string} projectDir The path of the project.
 * @returns {Promise<ICodesignResultData>} Information about the generation process. It is returned only on successfull generation. In case there is some error, the Promise is rejected with the server information.
 */
generateCodesignFiles(codesignData: ICodesignData, projectDir: string): Promise<ICodesignResultData>;
```
Detailed description of the parameter can be found [here](./lib/definitions/cloud-codesign-service.d.ts).
</br>
Usage:
```JavaScript
const tns = require("nativescript");
const codesignResultData = tns.nsCloudBuildService
			.generateCodesignFiles({
				username:'appleuser@mail.com',
				password:'password',
				platform: "ios",
				clean: true,
				attachedDevices: [{
					displayName: 'iPhone',
					identifier: 'cc3653b16f1beab6cf34a53af84c8a94cb2f0c9f'
				}]
			}, '/tmp/projects/myproj');
```

#### getServerOperationOutputDirectory
`getServerOperationOutputDirectory` method returns the path to the directory where the server request output files may be found, if any. In this implementation - the generated codesign files. </br>
Definition:

```TypeScript
/**
 * Returns the path to the directory where the server request output may be found.
 * @param {ICloudServerOutputDirectoryOptions} options Options that are used to determine the build output directory.
 * @returns {string} The build output directory.
 */
getServerOperationOutputDirectory(options: ICloudServerOutputDirectoryOptions): string;
```
Detailed description of the parameter can be found [here](./lib/definitions/cloud-service.d.ts).
</br>
Usage:
```JavaScript
const tns = require("nativescript");
const generateCodesignFilesOutputDirectory = tns.nsCloudBuildService
				.getServerOperationOutputDirectory({
					platform: "ios",
					projectDir: "/tmp/myProject"
					emulator: false
				});
```

### nsCloudPublishService
The `nsCloudPublishService` allows publishing build packages to an application store (either GooglePlay or iTunesConnect). You can call the following methods:

#### publishToItunesConnect
`publishToItunesConnect` method -will try to publish the provided package to iTunes Connect. </br>
Definition:

```TypeScript
/**
 * Publishes the given .ipa packages to iTunes Connect.
 * @param {IItunesConnectPublishData} publishData Data needed to publish to iTunes Connect.
 * @returns {Promise<void>}
 */
publishToItunesConnect(publishData: IItunesConnectPublishData): Promise<void>;
```
Detailed description of the parameter can be found [here](./lib/definitions/cloud-publish-service.d.ts).
</br>
Usage:
```JavaScript
const tns = require("nativescript");
tns.nsCloudPublishService
	.publishToItunesConnect({
		credentials: {
			username: "user",
			password: "pass"
		},
		packagePaths: ["/tmp/myReleaseIpa.ipa"],
		projectDir: "/tmp/myProject"
	})
	.then(() => {
		console.log("Publishing succeeded");
	})
	.catch(err => console.error(err));
```

#### publishToGooglePlay
`publishToGooglePlay` method will try to publish the provided packages to Google Play. </br>
Definition:

```TypeScript
/**
 * Publishes the given .apk packages to Google Play.
 * @param {IGooglePlayPublishData} publishData Data needed to publish to Google Play.
 * @returns {Promise<void>}
 */
publishToGooglePlay(publishData: IGooglePlayPublishData): Promise<void>;
```
Detailed description of the parameter can be found [here](./lib/definitions/cloud-publish-service.d.ts).
</br>
Usage:
```JavaScript
const tns = require("nativescript");
tns.nsCloudPublishService
	.publishToGooglePlay({
		track: "alpha",
		pathToAuthJson: "/tmp/myAuthJson.json",
		packagePaths: ["/tmp/myReleaseApk.apk"],
		projectDir: "/tmp/myProject"
	})
	.then(() => {
		console.log("Publishing succeeded");
	})
	.catch(err => console.error(err));
```

### nsCloudApplicationService
The `nsCloudApplicationService` allows for application management and gathering more information about the app's current state. You can call the following methods:

#### shouldBuild
`shouldBuild` method will determine whether the current application should be built or not. </br>
Definition:

```TypeScript
/**
* Determines whether the application should be built or not.
* @param {IApplicationBuildConfig} config Settings used to help decide whether the project should be built or not.
* @returns {Promise<boolean>}
*/
shouldBuild(config: IApplicationBuildConfig): Promise<boolean>;
```
Detailed description of the parameter can be found [here](./lib/definitions/application-service.d.ts).
</br>
Usage:
```JavaScript
const tns = require("nativescript");
tns.nsCloudApplicationService
	.shouldBuild({
		projectDir: "/tmp/myProject",
		platform: "android",
		outputPath: "/tmp/myProject/.cloud/android" // for cloud builds
	})
	.then((shouldBuild) => {
		console.log("Should build? ", shouldBuild);
	})
	.catch(err => console.error(err));
```

#### shouldInstall
`shouldInstall` method will determine whether the current application's package should be installed on the given device or not. </br>
Definition:

```TypeScript
/**
* Determines whether the application's output package should be installed on the given device or not.
* @param {IApplicationInstallConfig} config Settings used to help decide whether the project's output should be installed or not.
* @returns {Promise<boolean>}
*/
shouldInstall(config: IApplicationInstallConfig): Promise<boolean>;
```
Detailed description of the parameter can be found [here](./lib/definitions/application-service.d.ts).
</br>
Usage:
```JavaScript
const tns = require("nativescript");
tns.nsCloudPublishService
	.shouldInstall({
		projectDir: "/tmp/myProject",
		deviceIdentifier: "192.168.56.101:5555",
		outputPath: "/tmp/myProject/.cloud/ios" // for cloud builds
	})
	.then((shouldInstall) => {
		console.log("Should install?", shouldInstall);
	})
	.catch(err => console.error(err));
```

### nsCloudEmulatorLauncher
The `nsCloudEmulatorLauncher` provides a way for initial interaction with cloud emulators. You can call the following methods:
* `startEmulator` method - starts an cloud emulator and returns a url where an html page is located, containing an iframe with the actual emulator. </br>
Definition:

```TypeScript
/**
 * Describes options that can be passed when starting a cloud emulator.
 */
interface ICloudEmulatorStartData {
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
 * Describes service for initial interaction with cloud emulators.
 */
interface ICloudEmulatorLauncher {
	/**
	 * Starts a cloud emulator.
	 * @param {ICloudEmulatorStartData} data Options for starting emulator.
	 * @param optional {IConfigOptions} options The config options.
	 * @returns {string} A url containing an html page with the emulator inside an iframe. The url's host is localhost.
	 */
	startEmulator(data: ICloudEmulatorStartData): Promise<string>;
}

```
Usage:
```JavaScript
const tns = require("nativescript");

tns.nsCloudEmulatorLauncher.startEmulator({
			packageFile: "test.apk",
			platform: "android",
			model: "nexus5"
		}).then(address => {
			console.log("address is", address);
			// http://localhost:56760/?publicKey=somekey&device=nexus5
		});
```

### nsCloudAuthenticationService
The `nsCloudAuthenticationService` is used for authentication related operations (login, logout etc.). You can call the following methods </br>

#### login
`login` mehod starts localhost server on which the login response will be returned. After that if there is `options.openAction` it will be used to open the login url. If this option is not defined the default opener will be used. After successful login returns the user information.
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

tns.nsCloudAuthenticationService
	.login()
	.then(userInfo => console.log(userInfo))
	.catch(err => console.error(err));
```

```JavaScript
const tns = require("nativescript");
const childProcess = require("child_process");

const openAction = url => {
	const isWin = /^win/.test(process.platform);
	const openCommand = isWin ? "start" : "open";
	childProcess.execSync(`${openCommand} ${url}`);
};
const loginOptions = { openAction: openAction };

tns.nsCloudAuthenticationService
	.login(loginOptions)
	.then(userInfo => console.log(userInfo))
	.catch(err => console.error(err));
```

#### logout
`logout` method invalidates the current user authentication data.
</br>
Definition:

```TypeScript
/**
 * Invalidates the current user authentication data.
 * If options.openAction is provided, it will be used to open the logout url instead of the default opener.
 * @param {IOpenActionOptions} options Optional settings for the logout method.
 * @returns {void}
 */
logout(options?: IOpenActionOptions): void;
```
</br>
Usage:

```JavaScript
const tns = require("nativescript");

tns.nsCloudAuthenticationService.logout();
```

```JavaScript
const tns = require("nativescript");
const childProcess = require("child_process");

const openAction = url => {
	const isWin = /^win/.test(process.platform);
	const openCommand = isWin ? "start" : "open";
	childProcess.execSync(`${openCommand} ${url}`);
};
const logoutOptions = { openAction: openAction };

tns.nsCloudAuthenticationService.logout(logoutOptions);
```

#### isUserLoggedIn
`isUserLoggedIn` method checks if the access token of the current user is valid. If it is - the method will return true. If it isn't - the method will try to issue new access token. If the method can't issue new token it will return false.
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

tns.nsCloudAuthenticationService
	.isUserLoggedIn()
	.then(isLoggedIn => console.log(isLoggedIn))
	.catch(err => console.error(err));
```

#### refreshCurrentUserToken
`refreshCurrentUserToken` method uses the refresh token of the current user to issue new access token.
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

tns.nsCloudAuthenticationService.refreshCurrentUserToken()
	.then(() => console.log("Success"))
	.catch(err => console.error(err));
```


#### cancelLogin
`cancelLogin` method stops the current login process and rejects the login promise with an error.
</br>

Definition:

```TypeScript
/**
 * Stops the current login process and rejects the login promise with an error.
 * @returns {void}
 */
cancelLogin(): void;
```
</br>

Usage:
```JavaScript
const tns = require("nativescript");

tns.nsCloudAuthenticationService
	.login()
	.then(userInfo => console.log(userInfo))
	.catch(err => console.error(err));

tns.nsCloudAuthenticationService.cancelLogin();
```

#### Interfaces
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
	 * Checks the token state of the current user.
	 * @returns {Promise<ITokenState>} Returns the token state
	 */
	getCurrentUserTokenState(): Promise<ITokenState>;

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

### nsCloudUserService
The `nsCloudUserService` is used to get information aboud the current user or modify it. You can call the following methods </br>

#### hasUser
`hasUser` method checks if there is user information.
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

const hasUser = tns.nsCloudUserService.hasUser();
console.log(hasUser);
```

#### getUser
`getUser` method returns the current user information.
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

const user = tns.nsCloudUserService.getUser();
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

#### getUserData
`getUserData` method returns the user information and the authentication data for the current user.
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

const userData = tns.nsCloudUserService.getUserData();
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

#### setUserData
`setUserData` method sets the user information and the authentication data for the current user.
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

tns.nsCloudUserService.setUserData(userData);
```

#### setToken
`setToken` method sets only the token of the current user.
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

tns.nsCloudUserService.setToken(token);
```

#### clearUserData
`clearUserData` method removes the current user data.
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

tns.nsCloudUserService.clearUserData();
```

#### getUserAvatar
`getUserAvatar` methods returns the URL where the avatar picture can be downloaded from.
</br>
Definition:

```TypeScript
/**
* Return the URL where the avatar picture can be downloaded from.
* @returns {Promise<string>} Return the URL where the avatar picture can be downloaded from. It will return null if the user does not have avatar or it is not logged in.
*/
getUserAvatar(): Promise<string>;
```
</br>
Usage:

```JavaScript
const tns = require("nativescript");

tns.nsCloudUserService.hasUser()
	.then(userAvatar => console.log(userAvatar));
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

	/**
	 * Return the URL where the avatar picture can be downloaded from.
	 * @returns {Promise<string>} Return the URL where the avatar picture can be downloaded from. It will return null if the user does not have avatar or it is not logged in.
	 */
	getUserAvatar(): Promise<string>;
}
```

### nsCloudAccountsService
The `nsCloudAccountsService` provides methods for working with accounts. You can call the following methods:

#### getMyAccounts
`getMyAccounts` method returns the accounts which the current user can use. Each user will have personal account and shared accounts. Shared accounts are those accounts in which the user is added as developer. </br>
Definition:

```TypeScript
/**
 * Returns all accounts which can be used from the current user.
 * Each user can have personal account and shared accounts.
 * @returns {Promise<IAccount[]>}
 */
getMyAccounts(): Promise<IAccount[]>
```
Detailed description of each parameter can be found [here](./lib/definitions/accounts-service.d.ts).
</br>

Usage:

```JavaScript
const tns = require("nativescript");

tns.nsCloudAccountsService.getMyAccounts()
	.then(accounts => console.log(accounts));
```

#### getUsageInfo
`getUsageInfo` method returns the usage information for the provided account. </br>
Definition:

```TypeScript
/**
 * Returns the usage information for the provided account.
 * @param {string} accountId Account id which will be used to get the usage info.
 * @returns {Promise<IUsageInfo[]>}.
 */
getUsageInfo(accountId: string): Promise<IUsageInfo[]>;
```
Detailed description of each parameter can be found [here](./lib/definitions/accounts-service.d.ts).
</br>

Usage:

```JavaScript
const tns = require("nativescript");

tns.nsCloudAccountsService.getUsageInfo("d0ce3ac0-36c2-427f-8d27-955915ffe189")
	.then(usageInfo => console.log(usageInfo));
```

### nsCloudEulaService
`nsCloudEulaService` allows interaction with EULA - check if current EULA should be accepted, accepting it, etc.

#### getEulaData
`getEulaData` method gives information for the current EULA - url where to find it and if the user should accept it. When this method is called, it will download the latest EULA in case it has not been already downloaded in the current process. EULA must be accepted in the following condition:
* In case it has never been accepted.
* In case it has been accepted before, but current EULA is different, i.e. user had not accepted it before.

In all other cases (current EULA is the same as the one user had accepted before, new EULA cannot be downloaded, but user had accepted EULA in the past), the method will return that EULA should not be accepted.

Definition:

```TypeScript
/**
 * Gives information about the EULA. This method downloads the EULA to a local file (once for process).
 * @returns {Promise<IEulaData>} Information about the EULA - url and should the user accept it.
 */
getEulaData(): Promise<IEulaData>;
```
The returned result is of the following type:
```TypeScript
/**
 * Contains information about EULA.
 */
interface IEulaData {
	/**
	 * URL where the EULA can be found.
	 */
	url: string;

	/**
	 * Defines if EULA should be accepted by user.
	 */
	shouldAcceptEula: boolean;
}
```
</br>

Usage:
```JavaScript
const tns = require("nativescript");

tns.nsCloudEulaService.getEulaData()
	.then(eulaData => console.log(`EULA url is: ${eulaData.url}. This EULA should ${eulaData.shouldAcceptEula ? "" : "not" } be accepted.`));
```

#### getEulaDataWitCache
`getEulaDataWithCache` method gives information for the current EULA - url where to find it and if the user should accept it. When this method is called, it will download the latest EULA ONLY in case it has not been downloaded in the latest 24 hours. That's the main difference between this method and `getEulaData`. EULA must be accepted in the following condition:
* In case it has never been accepted.
* In case it has been accepted before, but current EULA is different, i.e. user had not accepted it before.

In all other cases (current EULA is the same as the one user had accepted before, new EULA cannot be downloaded, but user had accepted EULA in the past), the method will return that EULA should not be accepted.

Definition:

```TypeScript
/**
 * Gives information about the EULA. This method downloads the EULA to a local file (once for process)
 * only in case the local copy has not been modified for more than 24 hours.
 * @returns {Promise<IEulaData>} Information about the EULA - url and should the user accept it.
 */
getEulaDataWithCache(): Promise<IEulaData>;
```
The returned result has the same type as the one returned by `getEulaData`.
</br>

Usage:
```JavaScript
const tns = require("nativescript");

tns.nsCloudEulaService.getEulaDataWithCache()
	.then(eulaData => console.log(`EULA url is: ${eulaData.url}. This EULA should ${eulaData.shouldAcceptEula ? "" : "not" } be accepted.`));
```

#### acceptEula
`acceptEula` method downloads the latest EULA (in case it has not been downloaded in the current process), calculates its shasum and saves it in the user setings file. In case any of the operations fails, the `acceptEula` Promise will be rejected with the error.
</br>
Definition:

```TypeScript
/**
 * Accepts the EULA. The method first downloads the latest EULA (in case it has not been already downloaded in current process) and saves its shasum to user settings file.
 * @returns {Promise<void>}
 */
acceptEula(): Promise<void>;
```
</br>

Usage:
```JavaScript
const tns = require("nativescript");

tns.nsCloudEulaService.acceptEula()
	.then(() => console.log(`Successfully accepted EULA.`))
	.catch(err => console.error("Unable to accept EULA. Error is: ", err));
```

## Development
The project is written in TypeScript. After cloning it, you can set it up by executing the following commands in your terminal:
* `$ npm i --ignore-scripts` - NOTE: `--ignore-scripts` is a must.
* `$ npm i -g grunt-cli` (only in case you do not have it installed globally)
* `$ grunt test` (first execution of this command might take a little bit longer, consecutive calls will work much faster)

After that you can make changes in the code. In order to transpile them, just execute:
* `$ grunt`

You can pack a new version of the library by executing:
* `$ grunt pack`
