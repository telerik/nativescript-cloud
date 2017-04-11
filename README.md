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

### Development
The project is written in TypeScript. After cloning it, you can set it up by executing the following commands in your terminal:
* `$ npm i --ignore-scripts` - NOTE: `--ignore-scripts` is a must.
* `$ npm i -g grunt-cli` (only in case you do not have it installed globally)
* `$ grunt test` (first execution of this command might take a little bit longer, consecutive calls will work much faster)

After that you can make changes in the code. In order to transpile them, just execute:
* `$ grunt`

You can pack a new version of the library by executing:
* `$ grunt pack`
