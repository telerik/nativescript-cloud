cloud build
==========

Usage | Synopsis
------|-------
Build application for Android | `$ tns cloud build android --accountId <Account Identifier>`
Build application in release for Android | `$ tns cloud build android --accountId <Account Identifier> --release --key-store-path <Certificate Path> --key-store-password <Password>`
Build application for iOS Device | `$ tns cloud build ios --accountId <Account Identifier> --certificate <Certificate Path> --certificatePassword <Certificate Password> --provision <Provision Path>`
Build application for iOS Simulator | `$ tns cloud build ios --accountId <Account Identifier> --emulator`
Build application in release for iOS | `$ tns cloud build ios --accountId <Account Identifier> --certificate <Certificate Path> --certificatePassword <Certificate Password> --provision <Provision Path> --release`

Builds your project the project in the cloud for specified platform. The produced build result (`.apk`, `.ipa` or `.zip` containing `.app` for iOS Simulator) is downloaded in the `.cloud` directory at the root of the project.

### Options
* `--accountId` - Specifies the account for which to print the information. It is mandatory to pass this option. `<Account Identifier>` is the index or `Account` as listed by the `$ tns account` command or the unique identifier (you can get it from the `tns account` again).
* `--certificate` - Specifies the local path to the certificate that will be used to codesign the application. `<Certificate Path>` is the actual path (full or relative to the current directory).
* `--certificatePassword` - Specifies the password of the certificate passed with `--certificate` option.
* `--provision` - Specifies the path to the provision that will be used for codesigning the application. `<Provision Path>` is the actual path (full or relative to the current directory).
* `--key-store-path` - Specifies the file path to the keystore file (P12) which you want to use to code sign your APK. You can use the `--key-store-*` options along with `--release` to produce a signed release build. You need to specify all `--key-store-*` options.
* `--key-store-password` - Provides the password for the keystore file specified with `--key-store-path`. You can use the `--key-store-*` options along with `--release` to produce a signed release build. You need to specify all `--key-store-*` options.
* `--emulator` - Specifies the build will be for Virtual Device - Android Emulator or iOS Simulator.
* `--sharedCloud` - Builds the application in the shared cloud instead of the private one. This option is valid only for users who have Private Cloud feature enabled.

<% if(isHtml) { %>
### Related Commands

Command | Description
----------|----------
[logout](logout.html) | Logs you out.
[user](user.html) | Prints information about the currently logged in user, including name, email address, subscription plan and license expiration date.
<% } %>
