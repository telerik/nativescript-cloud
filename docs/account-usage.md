# tns account usage

### Description

Prints information about the cloud build quotas, including performed builds, remaining builds, reset date, license type, license expiration date and edition type.

### Commands

Usage | Synopsis
------|-------
General | `$ tns account usage --accountId <Account Identifier>`

### Options

* `--accountId` - A mandatory option that specifies the account for which to print the information. `<Account Identifier>` is the index (#) or unique identifier (Id) as listed by the `$ tns account` command.

<% if(isHtml) { %>

### Related Commands

Command | Description
----------|----------
[user](user.html) | Prints information about the features that are available for the specified account.
[account](account.html) | Prints information about the accounts that can be used from the currently logged user.
[account features](account-features.html) | Prints information about the features that are available for the specified account.
<% } %>
