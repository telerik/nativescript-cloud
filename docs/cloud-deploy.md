# tns cloud deploy

### Description

Builds your project, if necessary, and deploys it on all connected devices and running emulators that target the specified platform. In case there are no devices attached and no simulators/emulators are running, the command will start a new simulator/emulator and deploy the application on it.

### Commands

Usage | Synopsis
------|-------
Deploy on all connected Android devices and emulators | `$ tns cloud deploy android --accountId <Account Identifier>`
Deploy on all connected iOS devices and simulators | `$ tns cloud deploy ios --accountId <Account Identifier> --certificate <Certificate Path> --certificatePassword <Certificate Password> --provision <Provision Path>`
Build in release and deploy on all connected Android devices and emulators | `$ tns cloud deploy android --accountId <Account Identifier> --release --key-store-path <Certificate Path> --key-store-password <Password>`
Build in release and deploy on all connected iOS devices and simulators | `$ tns cloud deploy ios --accountId <Account Identifier> --release --certificate <Certificate Path> --certificatePassword <Certificate Password> --provision <Provision Path>`

### Options

* `--accountId` - A mandatory option that specifies the account which will be used to build the application. `<Account Identifier>` is the index (#) or unique identifier (Id) as listed by the `$ tns account` command.
* `--certificate` - Specifies the local path to the certificate that will be used to codesign the application. `<Certificate Path>` is the full or relative to the current directory path to the certificate.
* `--certificatePassword` - Specifies the password of the certificate passed with the `--certificate` option.
* `--provision` - Specifies the path to the provision that will be used to codesign the application. `<Provision Path>` is the full or relative to the current directory path to the certificate.
* `--key-store-path` - Specifies the file path to the keystore file (P12) which you want to use to code sign your APK. You can use the `--key-store-*` options along with `--release` to produce a signed release build. You need to specify all `--key-store-*` options.
* `--key-store-password` - Provides the password for the keystore file specified with `--key-store-path`. You can use the `--key-store-*` options along with `--release` to produce a signed release build. You need to specify all `--key-store-*` options.
* `--sharedCloud` - Builds the application in the shared cloud instead of the private one. This option is valid only for users who have access to the Private Cloud feature.

<% if(isHtml) { %>

### Related Commands

Command | Description
----------|----------
[cloud build](cloud-build.html) | Builds the project in the cloud for a specified platform.
[cloud run](cloud-run.html) | Runs your project on all connected iOS and Android devices, Android emulators and iOS Simulators.
<% } %>
