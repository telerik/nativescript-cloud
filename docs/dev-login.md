dev-login
==========

Usage | Synopsis
------|-------
General | `$ tns dev-login <Email> <Password>`

Logins you with the specified email and password. Unlike `tns login` command, `tns dev-login` does not open a browser window.
>NOTE: This command should be used in CI builds only. We recommend you to use `tns login` during your development process.

### Arguments
* `Email` is the email of the user that will be logged in.
* `Password` is the password for the specified account

<% if(isHtml) { %>
### Related Commands

Command | Description
----------|----------
[logout](logout.html) | Logs you out.
[user](user.html) | Prints information about the currently logged in user, including name, email address, subscription plan and license expiration date.
<% } %>
