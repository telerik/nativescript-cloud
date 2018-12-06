tns cloud codesign
==========

Usage | Synopsis
------|-------
General | `$ tns cloud codesign [[<Apple ID>] [<Apple Password>]]`

Generates a pair of provision and certificate using the Apple Free Developer Program. The provision will include all currently attached iOS devices, so you can use the generated codesign pair to deploy your application on those device.
If you do not pass required arguments, CLI will prompt you for them.
Once the files are generated, they will be downloaded in `codesign_files` directory at the root of your project.

### Arguments
* `Apple ID` is the username for your Apple account.
* `Apple Password` is the password for your account.

### Command Limitations
You need Apple account, so you can use the Free developer program.

<% if(isHtml) { %>
### Related Commands

Command | Description
----------|----------
[logout](logout.html) | Logs you out.
[user](user.html) | Prints information about the currently logged in user, including name, email address, subscription plan and license expiration date.
<% } %>
