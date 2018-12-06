# tns cloud publish android

### Description

Publishes your application in the Android Play Store. The command first builds the current app in the cloud and then uploads the built `.apk` in the Play Store.

### Commands

Usage | Synopsis
---|---
General | `$ tns cloud publish android <path to authentication.json> --accountId <Account Identifier> --key-store-path <File Path> --key-store-password <Password> [--bundle [<value>] [--env.*]] --track <Track>`

### Arguments
* `<path to authentication.json>` - the path to the `authentication.json` file that you have downloaded from your Google Console.

### Options

* `--accountId` - Specifies the account for which to print the information. It is mandatory to pass this option. `<Account Identifier>` is the index or `Account` as listed by the `$ tns account` command or the unique identifier (you can get it from the `tns account` again).
* `--key-store-path` - Specifies the file path to the keystore file (P12) which you want to use to code sign your APK.
* `--key-store-password` - Provides the password for the keystore file specified with `--key-store-path`.
* `--bundle` - Specifies that the `webpack` bundler will be used to bundle the application.
* `--env.*` - Specifies additional flags that the bundler may process. May be passed multiple times. For example: `--env.uglify --env.snapshot`
* `--sharedCloud` - Builds the application in the shared cloud instead of the private one. This option is valid only for users who have Private Cloud feature enabled.
* `--track` - specifies the track for which to publish the application. In case this flag is not passed, CLI will prompt you to specify it. In a non-interactive terminal, CLI defaults to 'beta' track.

<% if(isHtml) { %>

### Related Commands

Command | Description
----------|----------
[logout](logout.html) | Logs you out.
[user](user.html) | Prints information about the currently logged in user, including name, email address, subscription plan and license expiration date.
<% } %>
