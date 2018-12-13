# tns cloud codesign

### Description

Generates a pair of temporary provision and certificate using the Apple Free Developer Program. The provision will include all currently attached iOS devices, so you can use the generated codesign pair to deploy your application only on those device. Once the files are generated, they will be downloaded in the `codesign_files` directory at the root of your project.

The Apple ID and Password arguments are mandatory and if you do not provide them with the command, the NativeScript CLI will prompt you for them.

### Commands

Usage | Synopsis
------|-------
General | `$ tns cloud codesign [[<Apple ID>] [<Apple Password>]]`

### Arguments

* `<Apple ID>` is the username of your free Apple account.
* `<Apple Password>` is the password of your free Apple your account.

<% if(isHtml) { %>

### Command Limitations

* Currently, the temporary code signing assets can be generated only with Free Apple Developer accounts.
* To generate the certificate and mobile provision, you must have an iOS device attached to your machine while running the command.

### Related Commands

Command | Description
----------|----------
[cloud run](cloud-run.html) | Runs your project on all connected iOS and Android devices, Android emulators and iOS Simulators.
<% } %>
