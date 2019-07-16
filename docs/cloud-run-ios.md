# tns cloud run ios

### Description

Runs your project on all connected iOS devices and in the iOS Simulators, if configured. While your app is running, prints the output from the application in the console and watches for changes in your code. Once a change is detected, it synchronizes the change with all selected devices and restarts/refreshes the application.

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
* `--release` - If set, produces a release build. Otherwise, produces a debug build.
* `--hmr` - Enables the hot module replacement (HMR) feature.
* `--env.*` - Specifies additional flags that the bundler may process. May be passed multiple times. For example: `--env.uglify --env.snapshot`.
* `--syncAllFiles` - Watches all production dependencies inside node_modules for changes. Triggers project rebuild if necessary!
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
