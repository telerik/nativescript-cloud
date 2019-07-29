# tns cloud publish ios

### Description

Builds the project in the cloud and then uploads the produced application package (`.ipa`) to the AppStore.

### Commands

Usage | Synopsis
---|---
General | `$ tns cloud publish ios [<Apple ID>] [<Apple Password>] --accountId <Account Identifier> --certificate <Certificate Path> --certificatePassword <Certificate Password> --provision <Provision Path> [--env.*] --track <Track>`

### Arguments

* `<Apple ID>` is the username of your free Apple account.
* `<Apple Password>` is the password of your free Apple your account.

### Options

* `--accountId` - A mandatory option that specifies the account which will be used to build the application. `<Account Identifier>` is the index (#) or unique identifier (Id) as listed by the `$ tns account` command.
* `--certificate` - Specifies the local path to the certificate that will be used to codesign the application. `<Certificate Path>` is the full or relative to the current directory path to the certificate.
* `--certificatePassword` - Specifies the password of the certificate passed with the `--certificate` option.
* `--provision` - Specifies the path to the provision that will be used to codesign the application. `<Provision Path>` is the full or relative to the current directory path to the certificate.
* `--env.*` - Specifies additional flags that the bundler may process. May be passed multiple times. For example: `--env.uglify --env.snapshot`
* `--sharedCloud` - Builds the application in the shared cloud instead of the private one. This option is valid only for users who have access to the Private Cloud feature.

<% if(isHtml) { %>

### Related Commands

Command | Description
----------|----------
[cloud build](cloud-build.html) | Builds the project in the cloud for a specified platform.
[cloud run](cloud-run.html) | Runs your project on all connected iOS and Android devices, Android emulators and iOS Simulators.
<% } %>
