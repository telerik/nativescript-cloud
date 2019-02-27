# tns cloud dev-apple-login

### Description

Uses the provided Apple credentials to obtain Apple session which can be used when publishing to Apple AppStore.

### Commands

Usage | Synopsis
---|---
General | `$ tns cloud dev-apple-login [<Apple ID>] [<Apple Password>] [--otp <value> --outputPath <value>]`

### Arguments

* `<Apple ID>` is the username of your Apple account.
* `<Apple Password>` is the password of your Apple your account.

### Options

* `--otp` - Specifies the one-time password which should be used during the login. If this option is not provided, the CLI will prompt the user to enter the one-time password.
* `--outputPath` - Specifies the local path where the Apple session should be saved. If this option is not provided, the Apple session will be displayed on the stdout.

<% if(isHtml) { %>

### Related Commands

Command | Description
----------|----------
[cloud publish ios](cloud-publish-ios.html) | Builds the project in the cloud and then uploads the produced application package (`.ipa`) to the AppStore.
<% } %>
