# tns cloud run android

### Description

Runs your project on all connected Android devices and running emulators. While your app is running, prints the output from the application in the console and watches for changes in your code. Once a change is detected, it synchronizes the change with all selected devices and restarts/refreshes the application.

To enable Hot Module Replacement (HMR) in Angular projects, follow the steps outlined in this wiki: https://github.com/NativeScript/nativescript-angular/wiki/HMR.

### Commands

Usage | Synopsis
---|---
Run on all connected devices and running emulators | `$ tns cloud run android --accountId <Account Identifier> [--key-store-path <File Path> --key-store-password <Password>] [--release] [--justlaunch] [--bundle [<value>] [--env.*]]`
Run on a selected connected device or running emulator. Will start emulator with specified `Device Identifier`, if not already running. | `$ tns cloud run android --accountId <Account Identifier> --device <Device ID> [--key-store-path <File Path> --key-store-password <Password>] [--release] [--justlaunch] [--bundle [<value>] [--env.*]]`
Start a default emulator if none are running, or run application on all connected emulators. | `$ tns cloud run android --accountId <Account Identifier> --emulator [--key-store-path <File Path> --key-store-password <Password>] [--release] [--justlaunch] [--bundle [<value>] [--env.*]]`

### Options

* `--accountId` - Specifies the account for which to print the information. It is mandatory to pass this option. `<Account Identifier>` is the index or `Account` as listed by the `$ tns account` command or the unique identifier (you can get it from the `tns account` again).
* `--device` - Specifies a connected device or emulator to start and run the app. `<Device ID>` is the index or `Device Identifier` of the target device as listed by the `$ tns device android --available-devices` command.
* `--emulator` - If set, runs the app in all available and configured Android emulators. It will start an emulator if none are already running.
* `--justlaunch` - If set, does not print the application output in the console.
* `--clean` - If set, forces the complete rebuild of the native application.
* `--no-watch` - If set, changes in your code will not be reflected during the execution of this command.
* `--release` - If set, produces a release build. Otherwise, produces a debug build. When set, you must also specify the `--key-store-*` options.
* `--key-store-path` - Specifies the file path to the keystore file (P12) which you want to use to code sign your APK. You can use the `--key-store-*` options along with `--release` to produce a signed release build. You need to specify all `--key-store-*` options.
* `--key-store-password` - Provides the password for the keystore file specified with `--key-store-path`. You can use the `--key-store-*` options along with `--release` to produce a signed release build. You need to specify all `--key-store-*` options.
* `--bundle` - Specifies that the `webpack` bundler will be used to bundle the application.
* `--hmr` - (Beta) Enables the hot module replacement (HMR) feature. HMR depends on `webpack` and adding the `--hmr` flag to the command will automatically enable the `--bundle` option as well. <% if(isConsole) { %> The HMR feature is currently in Beta. For more information about the current development state and any known issues, please check the relevant GitHub issue: https://github.com/NativeScript/NativeScript/issues/6398.<% } %>
* `--env.*` - Specifies additional flags that the bundler may process. May be passed multiple times. For example: `--env.uglify --env.snapshot`.
* `--syncAllFiles` - Watches all production dependencies inside node_modules for changes. Triggers project rebuild if necessary!
* `--sharedCloud` - Builds the application in the shared cloud instead of the private one. This option is valid only for users who have access to the Private Cloud feature.

<% if(isHtml) { %>

>Note: Hot Module Replacement (HMR) is currently in Beta. For more information about the current development state and any known issues, please check the relevant GitHub issue: https://github.com/NativeScript/NativeScript/issues/6398.

### Command Limitations

* You cannot use the `--device` and `--emulator` options simultaneously.
* When the `--release` flag is set, you must also specify all `--key-store-*` options.

### Related Commands

Command | Description
----------|----------
[cloud build](cloud-build.html) | Builds the project in the cloud for a specified platform.
[cloud run](cloud-run.html) | Runs your project on all connected iOS and Android devices, Android emulators and iOS Simulators.
<% } %>
