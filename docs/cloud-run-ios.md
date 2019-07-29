# tns cloud run ios

### Description

Runs your project on all connected iOS devices and in the iOS Simulators, if configured. While your app is running, prints the output from the application in the console and watches for changes in your code. Once a change is detected, it synchronizes the change with all selected devices and restarts/refreshes the application.

<% if(isHtml) { %>
When running this command without passing --release flag, the HMR (Hot Module Replacement) is enabled by default. In case you want to disable HMR, you can pass --no-hmr flag. When --release is passed, CLI disables HMR.

#### How file changes are handled
With HMR (Hot Module Replacement):
* Changes in `.js`, `.ts`, `.less`, `.sass` and other file types that are accepted will cause a refresh of the application.
* Changes in `App_Resources` will cause a rebuild of the application.
* Changes in any `package.json` file inside the project will cause a rebuild of the application.
* Changes in `node_modules/somePlugin` if accepted will cause a refresh of the application.
* Changes in `node_modules/somePlugin/platforms` will cause a rebuild of the application.
* Changes in `node_modules/somePlugin/package.json` file will cause a rebuild of the application.
* Changes that are not accepted and HMR fails will cause a restart of the native application.

With **no** HMR:
* Changes in `.js`, `.ts`, `.less`, `.sass` and other file types will cause a restart of the native application.
* Changes in `App_Resources` will cause a rebuild of the application.
* Changes in any `package.json` file inside the project will cause a rebuild of the application.
* Changes in `node_modules/somePlugin` will cause a restart of the native application.
* Changes in `node_modules/somePlugin/platforms` will cause a rebuild of the application.
* Changes in `node_modules/somePlugin/package.json` file will cause a rebuild of the application.
<% } %>

### Commands

Usage | Synopsis
---|---
Run on all connected devices | `$ tns cloud run ios --accountId <Account Identifier> --certificate <Certificate Path> --certificatePassword <Certificate Password> --provision <Provision Path> [--release] [--justlaunch] [--env.*]`
Run on a selected connected device. Will start simulator with specified `Device Identifier`, if not already running. | `$ tns run ios [--device <Device ID>] [--release] [--justlaunch] [--env.*]`
Start an emulator and run the app inside it | `$ tns cloud run ios --accountId <Account Identifier> --certificate <Certificate Path> --certificatePassword <Certificate Password> --provision <Provision Path> --emulator [--release] [--env.*]`
Start an emulator with specified device name and sdk | `$ tns cloud run ios --accountId <Account Identifier> --certificate <Certificate Path> --certificatePassword <Certificate Password> --provision <Provision Path> [--device <Device Name>] [--sdk <sdk>]`
Start an emulator with specified device identifier and sdk | `$ tns cloud run ios --accountId <Account Identifier> --certificate <Certificate Path> --certificatePassword <Certificate Password> --provision <Provision Path> [--device <Device Identifier>] [--sdk <sdk>]`

### Options

* `--accountId` - A mandatory option that specifies the account which will be used to build the application. `<Account Identifier>` is the index (#) or unique identifier (Id) as listed by the `$ tns account` command.
* `--certificate` - Specifies the local path to the certificate that will be used to codesign the application. `<Certificate Path>` is the full or relative to the current directory path to the certificate.
* `--certificatePassword` - Specifies the password of the certificate passed with `--certificate` option.
* `--provision` - Specifies the path to the provision that will be used to codesign the application. `<Provision Path>` is the full or relative to the current directory path to the certificate.
* `--device` - Specifies a connected device/simulator to start and run the app. `<Device ID>` is the index or `Device Identifier` of the target device as listed by the `$ tns device ios --available-devices` command.
* `--emulator` - If set, runs the app in all available and configured ios simulators. It will start a simulator if none are already running.
* `--sdk` - Specifies the target simulator's sdk.
* `--justlaunch` - If set, does not print the application output in the console.
* `--clean` - If set, forces the complete rebuild of the native application.
* `--no-watch` - If set, changes in your code will not be reflected during the execution of this command.
* `--release` - If set, produces a release build by running webpack in production mode and native build in release mode. Otherwise, produces a debug build.
* `--no-hmr` - Disables Hot Module Replacement (HMR). In this case, when a change in the code is applied, CLI will transfer the modified files and restart the application.
* `--env.*` - Specifies additional flags that the bundler may process. May be passed multiple times. For example: `--env.uglify --env.snapshot`.
* `--sharedCloud` - Builds the application in the shared cloud instead of the private one. This option is valid only for users who have access to the Private Cloud feature.

<% if(isHtml) { %>

### Command Limitations

* You cannot use the `--device` and `--emulator` options simultaneously.

### Related Commands

Command | Description
----------|----------
[cloud build](cloud-build.html) | Builds the project in the cloud for a specified platform.
[cloud run](cloud-run.html) | Runs your project on all connected iOS and Android devices, Android emulators and iOS Simulators.
<% } %>
