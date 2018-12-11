# tns cloud build

### Description

Builds the project in the cloud for a specified platform. The produced build result (`.apk`, `.ipa` or `.zip` containing `.app` for iOS Simulator) is downloaded in the `.cloud` directory, which is located in the root of the project.

### Commands

Usage | Synopsis
------|-------
Build app for Android | `$ tns cloud build android --accountId <Account Identifier>`
Build app in release for Android | `$ tns cloud build android --accountId <Account Identifier> --release --key-store-path <Certificate Path> --key-store-password <Password>`
Build app for iOS Device | `$ tns cloud build ios --accountId <Account Identifier> --certificate <Certificate Path> --certificatePassword <Certificate Password> --provision <Provision Path>`
Build app for iOS Simulator | `$ tns cloud build ios --accountId <Account Identifier> --emulator`
Build app in release for iOS | `$ tns cloud build ios --accountId <Account Identifier> --certificate <Certificate Path> --certificatePassword <Certificate Password> --provision <Provision Path> --release`

### Options

* `--accountId` - A mandatory option that specifies the account which will be used to build the application. `<Account Identifier>` is the index (#) or unique identifier (Id) as listed by the `$ tns account` command.
* `--certificate` - Specifies the local path to the certificate that will be used to codesign the application. `<Certificate Path>` is the full or relative to the current directory path to the certificate.
* `--certificatePassword` - Specifies the password of the certificate passed with the `--certificate` option.
* `--provision` - Specifies the path to the provision that will be used to codesign the application. `<Provision Path>` is the full or relative to the current directory path to the certificate.
* `--key-store-path` - Specifies the file path to the keystore file (P12) which you want to use to code sign your APK. You can use the `--key-store-*` options along with `--release` to produce a signed release build. You need to specify all `--key-store-*` options.
* `--key-store-password` - Provides the password for the keystore file specified with `--key-store-path`. You can use the `--key-store-*` options along with `--release` to produce a signed release build. You need to specify all `--key-store-*` options.
* `--emulator` - Specifies that the build will be for a virtual device - Android emulator or iOS simulator.
* `--sharedCloud` - Builds the application in the shared cloud instead of the private one. This option is valid only for users who have access to the Private Cloud feature.

<% if(isHtml) { %>

### Related Commands

Command | Description
----------|----------
[cloud run](cloud-run.html) | Runs your project on all connected iOS and Android devices, Android emulators and iOS Simulators.
<% } %>
