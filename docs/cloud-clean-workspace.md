tns cloud clean workspace
==========

Usage | Synopsis
------|-------
Clean cloud resources for current project (executed in project directory) | `$ tns cloud clean workspace`
Clean cloud resources for specified project | `$ tns cloud clean workspace [<App Identifier>] [<Project Name>]`

Removes the artefacts from cloud machines for specified project. In case command is executed outside of project and without some of the arguments, CLI will prompt you to fill them in.

### Arguments
* `App Identifier` is the application identifier of the application for which you want to remove the cloud resources. For example `org.nativescript.myApp`
* `Project Name` is the name of the application for which you want to remove the cloud resources. For example `myApp`.

<% if(isHtml) { %>
### Related Commands

Command | Description
----------|----------
[logout](logout.html) | Logs you out.
[user](user.html) | Prints information about the currently logged in user, including name, email address, subscription plan and license expiration date.
<% } %>
