# tns cloud publish ios

### Description

Publishes your application in the iOS AppStore. The command first builds the current app in the cloud and then uploads the built `.ipa` in the AppStore.

### Commands

Usage | Synopsis
---|---
General | `$ tns cloud publish ios [<Apple ID>] [<Apple Password>] --accountId <Account Identifier> --certificate <Certificate Path> --certificatePassword <Certificate Password> --provision <Provision Path> [--bundle [<value>] [--env.*]] --track <Track>`

### Arguments
* `Apple ID` is the username for your Apple account.
* `Apple Password` is the password for your account.

### Options

* `--accountId` - Specifies the account for which to print the information. It is mandatory to pass this option. `<Account Identifier>` is the index or `Account` as listed by the `$ tns account` command or the unique identifier (you can get it from the `tns account` again).
* `--certificate` - Specifies the local path to the certificate that will be used to codesign the application. `<Certificate Path>` is the actual path (full or relative to the current directory).
* `--certificatePassword` - Specifies the password of the certificate passed with `--certificate` option.
* `--provision` - Specifies the path to the provision that will be used for codesigning the application. `<Provision Path>` is the actual path (full or relative to the current directory).
* `--bundle` - Specifies that the `webpack` bundler will be used to bundle the application.
* `--env.*` - Specifies additional flags that the bundler may process. May be passed multiple times. For example: `--env.uglify --env.snapshot`
* `--sharedCloud` - Builds the application in the shared cloud instead of the private one. This option is valid only for users who have Private Cloud feature enabled.


<% if(isHtml) { %>

### Related Commands

Command | Description
----------|----------
[logout](logout.html) | Logs you out.
[user](user.html) | Prints information about the currently logged in user, including name, email address, subscription plan and license expiration date.
<% } %>
