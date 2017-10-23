import * as path from "path";

$injector.require("nsCloudHttpServer", path.join(__dirname, "http-server"));
$injector.require("nsCloudItmsServicesPlistHelper", path.join(__dirname, "itms-services-plist-helper"));
$injector.require("nsCloudServerConfigManager", path.join(__dirname, "server-config-manager"));
$injector.require("nsCloudBuildOutputFilter", path.join(__dirname, "cloud-build-output-filter"));
$injector.require("nsCloudDeviceEmulator", path.join(__dirname, "cloud-device-emulator"));
$injector.require("nsCloudOptionsProvider", path.join(__dirname, "cloud-options-provider"));
$injector.require("nsCloudBuildCommandHelper", path.join(__dirname, "commands", "build-command-helper"));

// Mobile.
$injector.require("nsCloudEmulatorDeviceDiscovery", path.join(__dirname, "mobile", "mobile-core", "cloud-emulator-device-discovery"));

// Public API.
$injector.requirePublicClass("nsCloudApplicationService", path.join(__dirname, "services", "application-service"));
$injector.requirePublicClass("nsCloudAuthenticationService", path.join(__dirname, "services", "authentication-service"));
$injector.requirePublicClass("nsCloudBuildService", path.join(__dirname, "services", "cloud-build-service"));
$injector.requirePublicClass("nsCloudCodesignService", path.join(__dirname, "services", "cloud-codesign-service"));
$injector.requirePublicClass("nsCloudEmulatorLauncher", path.join(__dirname, "services", "cloud-emulator-emulator-launcher"));
$injector.requirePublicClass("nsCloudPublishService", path.join(__dirname, "services", "cloud-publish-service"));
$injector.requirePublicClass("nsCloudUserService", path.join(__dirname, "services", "user-service"));
$injector.requirePublicClass("nsCloudAccountsService", path.join(__dirname, "services", "accounts-service"));
$injector.requirePublicClass("nsCloudEulaService", path.join(__dirname, "services", "eula-service"));

// Services.
$injector.require("nsCloudAuthCloudService", path.join(__dirname, "services", "cloud-services", "auth-cloud-service"));
$injector.require("nsCloudBuildCloudService", path.join(__dirname, "services", "cloud-services", "build-cloud-service"));
$injector.require("nsCloudServicesProxy", path.join(__dirname, "services", "cloud-services", "cloud-services-proxy"));
$injector.require("nsCloudRequestService", path.join(__dirname, "services", "cloud-services", "cloud-request-service"));
$injector.require("nsCloudEmulatorService", path.join(__dirname, "services", "cloud-services", "cloud-emulator-service"));
$injector.require("nsCloudCodeCommitService", path.join(__dirname, "services", "cloud-services", "code-commit-service"));
$injector.require("nsCloudAccountsCloudService", path.join(__dirname, "services", "cloud-services", "accounts-cloud-service"));
$injector.require("nsCloudPackageInfoService", path.join(__dirname, "services", "package-info-service"));
$injector.require("nsCloudUploadService", path.join(__dirname, "services", "upload-service"));
$injector.require("nsCloudGitService", path.join(__dirname, "services", "git-service"));

// Commands.
$injector.requireCommand("config|*get", path.join(__dirname, "commands", "config", "config-get"));
$injector.requireCommand("config|apply", path.join(__dirname, "commands", "config", "config-apply"));
$injector.requireCommand("config|reset", path.join(__dirname, "commands", "config", "config-reset"));
$injector.requireCommand("config|set", path.join(__dirname, "commands", "config", "config-set"));

$injector.requireCommand("dev-login", path.join(__dirname, "commands", "dev-login"));
$injector.requireCommand("login", path.join(__dirname, "commands", "login"));
$injector.requireCommand("logout", path.join(__dirname, "commands", "logout"));

$injector.requireCommand("user", path.join(__dirname, "commands", "user"));
$injector.requireCommand("kill-server", path.join(__dirname, "commands", "kill-server"));

$injector.requireCommand(["cloud|build", "build|cloud"], path.join(__dirname, "commands", "cloud-build"));
$injector.requireCommand(["cloud|codesign", "codesign|cloud"], path.join(__dirname, "commands", "cloud-codesign"));
$injector.requireCommand("cloud|publish|android", path.join(__dirname, "commands", "cloud-publish"));
$injector.requireCommand("cloud|publish|ios", path.join(__dirname, "commands", "cloud-publish"));
$injector.requireCommand("cloud|lib|version", path.join(__dirname, "commands", "cloud-lib-version"));

$injector.requireCommand("account|*list", path.join(__dirname, "commands", "account", "account-list"));
$injector.requireCommand("account|usage", path.join(__dirname, "commands", "account", "usage"));
