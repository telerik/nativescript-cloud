# tns policy accept

### Description

Accepts a specified policy that relates to the NativeScript cloud service.

<% if(isHtml) { %>><% } %>NOTE: This command is useful in CI scenarios. In your daily work, the NativeScript CLI will prompt you to accept the required policies, so you won't need to use this command on your development machine.

### Commands

Usage | Synopsis
------|-------
General | `$ tns accept policy <Policy Name>`

### Arguments

* `<Policy Name>` is the name of the policy that should be accepted. Currently, the only valid value is `cloud-services-policy`.

<% if(isHtml) { %>

### Related Commands

Command | Description
----------|----------
[accept eula](accept-eula.html) | Accepts all the EULAs that relate to the NativeScript cloud service.
<% } %>
