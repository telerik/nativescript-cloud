# tns dev-login

### Description

Logs you in with the specified email and password. Unlike the `tns login` command, `tns dev-login` does not open a browser window, which can be useful for CI builds.

>NOTE: We recommend you to use `tns login` during your development process and utilize the `tns dev-login` command only in CI scenarios.

### Commands

Usage | Synopsis
------|-------
General | `$ tns dev-login <Email> <Password>`

### Arguments

* `<Email>` is the email of the user that will be logged in.
* `<Password>` is the password for the specified account.

<% if(isHtml) { %>

### Related Commands

Command | Description
----------|----------
[login](login.html) | Opens a new browser window in which you can provide your Progress Telerik credentials.
[logout](logout.html) | Logs you out.
[user](user.html) | Prints information about the currently logged in user, including name, email address, subscription plan and license expiration date.
<% } %>
