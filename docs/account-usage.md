account usage
==========

Usage | Synopsis
------|-------
General | `$ tns account usage --accountId <Account Identifier>`

Prints information about the cloud builds quotas, including performed builds, remaining builds, reset date, license type, license expiration date and edition type.

### Options

* `--accountId` - Specifies the account for which to print the information. It is mandatory to pass this option. `<Account Identifier>` is the index or `Account` as listed by the `$ tns account` command or the unique identifier (you can get it from the `tns account` again).

<% if(isHtml) { %>
### Related Commands

Command | Description
----------|----------
[login](login.html) | Opens a new browser window in which you can provide your Progress Telerik credentials.
[logout](logout.html) | Logs you out.
<% } %>
