# tns cloud publish android

### Description

Builds the project in the cloud and then uploads the produced application package (`.apk`) to Google Play.

### Commands

Usage | Synopsis
---|---
General | `$ tns cloud publish android <path to authentication.json> --accountId <Account Identifier> --key-store-path <File Path> --key-store-password <Password> [--bundle [<value>] [--env.*]] --track <Track>`

### Arguments

* `<path to authentication.json>` - the path to the `authentication.json` file that you have downloaded from your Google Console.

### Options

* `--accountId` - A mandatory option that specifies the account which will be used to build the application. `<Account Identifier>` is the index (#) or unique identifier (Id) as listed by the `$ tns account` command.
* `--key-store-path` - Specifies the file path to the keystore file (P12) which you want to use to code sign your APK.
* `--key-store-password` - Provides the password for the keystore file specified with `--key-store-path`.
* `--bundle` - Specifies that the `webpack` bundler will be used to bundle the application.
* `--env.*` - Specifies additional flags that the bundler may process. May be passed multiple times. For example: `--env.uglify --env.snapshot`.
* `--sharedCloud` - Builds the application in the shared cloud instead of the private one. This option is valid only for users who have Private Cloud feature enabled.
* `--track` - Specifies the Google Play release track for which to publish the application. In case the flag is not passed, the CLI will prompt you to specify it. In a non-interactive terminal, CLI defaults to 'beta' track.

<% if(isHtml) { %>

### Related Commands

Command | Description
----------|----------
[cloud build](cloud-build.html) | Builds the project in the cloud for a specified platform.
[cloud run](cloud-run.html) | Runs your project on all connected iOS and Android devices, Android emulators and iOS Simulators.
<% } %>
