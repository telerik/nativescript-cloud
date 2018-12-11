# tns cloud clean workspace

### Description

Removes the artifacts from the cloud machines for a specified project. In case command is executed outside of project and without some of the arguments, CLI will prompt you to fill them in.

### Commands

Usage | Synopsis
------|-------
Clean cloud resources for current project (executed in project directory) | `$ tns cloud clean workspace`
Clean cloud resources for specified project | `$ tns cloud clean workspace [<App Identifier>] [<Project Name>]`

### Arguments

`<App Identifier>` is the application identifier of the project for which you want to remove the cloud resources. For example, `org.nativescript.myApp`
`<Project Name>` is the name of the project for which you want to remove the cloud resources. For example, `myApp`.

<% if(isHtml) { %>

### Related Commands

Command | Description
----------|----------
[cloud build](cloud-build.html) | Builds the project in the cloud for a specified platform.
[cloud run](cloud-run.html) | Runs your project on all connected iOS and Android devices, Android emulators and iOS Simulators.
<% } %>
