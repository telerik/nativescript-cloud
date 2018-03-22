import * as path from "path";

$injector.require("nsCloudHttpServer", path.join(__dirname, "http-server"));
$injector.require("nsCloudItmsServicesPlistHelper", path.join(__dirname, "itms-services-plist-helper"));
$injector.require("nsCloudServerConfigManager", path.join(__dirname, "server-config-manager"));
$injector.require("nsCloudBuildOutputFilter", path.join(__dirname, "cloud-build-output-filter"));
$injector.require("nsCloudDeviceEmulator", path.join(__dirname, "cloud-device-emulator"));
$injector.require("nsCloudOptionsProvider", path.join(__dirname, "cloud-options-provider"));
$injector.require("nsCloudBuildHelper", path.join(__dirname, "cloud-build-helper"));
$injector.require("nsCloudBuildCommandHelper", path.join(__dirname, "commands", "build-command-helper"));
$injector.require("nsCloudEulaCommandHelper", path.join(__dirname, "commands", "eula-command-helper"));

// Mobile.
$injector.require("nsCloudEmulatorDeviceDiscovery", path.join(__dirname, "mobile", "mobile-core", "cloud-emulator-device-discovery"));

// Public API.
$injector.requirePublicClass("nsCloudApplicationService", path.join(__dirname, "services", "application-service"));
$injector.requirePublicClass("nsCloudAuthenticationService", path.join(__dirname, "services", "authentication-service"));
$injector.requirePublicClass("nsCloudBuildService", path.join(__dirname, "services", "cloud-build-service"));
$injector.requirePublicClass("nsCloudCodesignService", path.join(__dirname, "services", "cloud-codesign-service"));
$injector.requirePublicClass("nsCloudEmulatorLauncher", path.join(__dirname, "services", "cloud-emulator-emulator-launcher"));
$injector.requirePublicClass("nsCloudPublishService", path.join(__dirname, "services", "cloud-publish-service"));
$injector.requirePublicClass("nsCloudProjectService", path.join(__dirname, "services", "cloud-project-service"));
$injector.requirePublicClass("nsCloudUserService", path.join(__dirname, "services", "user-service"));
$injector.requirePublicClass("nsCloudAccountsService", path.join(__dirname, "services", "accounts-service"));
$injector.requirePublicClass("nsCloudEulaService", path.join(__dirname, "services", "eula-service"));
$injector.requirePublicClass("nsCloudKinveyEulaService", path.join(__dirname, "services", "kinvey-eula-service"));
$injector.requirePublicClass("nsCloudKinveyService", path.join(__dirname, "services", "kinvey-service"));

// Services.
$injector.require("nsCloudServerAuthService", path.join(__dirname, "services", "server", "server-auth-service"));
$injector.require("nsCloudServerBuildService", path.join(__dirname, "services", "server", "server-build-service"));
$injector.require("nsCloudServerServicesProxy", path.join(__dirname, "services", "server", "server-services-proxy"));
$injector.require("nsCloudServerRequestService", path.join(__dirname, "services", "server", "server-request-service"));
$injector.require("nsCloudServerEmulatorsService", path.join(__dirname, "services", "server", "server-emulators-service"));
$injector.require("nsCloudServerCodeCommitService", path.join(__dirname, "services", "server", "server-code-commit-service"));
$injector.require("nsCloudServerAccountsService", path.join(__dirname, "services", "server", "server-accounts-service"));
$injector.require("nsCloudServerProjectService", path.join(__dirname, "services", "server", "server-project-service"));
$injector.require("nsCloudKinveyRequestService", path.join(__dirname, "services", "server", "mbaas", "kinvey-request-service"));
$injector.require("nsCloudMBaasProxy", path.join(__dirname, "services", "server", "mbaas", "mbaas-proxy"));
$injector.require("nsCloudMBaasRequestService", path.join(__dirname, "services", "server", "mbaas", "mbaas-request-service"));
$injector.require("nsCloudPackageInfoService", path.join(__dirname, "services", "package-info-service"));
$injector.require("nsCloudUploadService", path.join(__dirname, "services", "upload-service"));
$injector.require("nsCloudDateTimeService", path.join(__dirname, "services", "date-time-service"));
$injector.require("nsCloudGitService", path.join(__dirname, "services", "git-service"));
$injector.require("nsCloudVersionService", path.join(__dirname, "services", "version-service"));
$injector.require("nsCloudPolyfillService", path.join(__dirname, "services", "polyfill-service"));
$injector.require("nsCloudBuildPropertiesService", path.join(__dirname, "services", "cloud-build-properties-service"));

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

$injector.requireCommand(["deploy|cloud", "cloud|deploy"], path.join(__dirname, "commands", "cloud-deploy"));
$injector.requireCommand(["run|cloud|*all", "cloud|run|*all"], path.join(__dirname, "commands", "cloud-run"));
$injector.requireCommand(["run|cloud|ios", "cloud|run|ios"], path.join(__dirname, "commands", "cloud-run"));
$injector.requireCommand(["run|cloud|android", "cloud|run|android"], path.join(__dirname, "commands", "cloud-run"));
$injector.requireCommand(["cloud|build", "build|cloud"], path.join(__dirname, "commands", "cloud-build"));
$injector.requireCommand(["cloud|codesign", "codesign|cloud"], path.join(__dirname, "commands", "cloud-codesign"));
$injector.requireCommand("cloud|publish|android", path.join(__dirname, "commands", "cloud-publish"));
$injector.requireCommand("cloud|publish|ios", path.join(__dirname, "commands", "cloud-publish"));
$injector.requireCommand("cloud|lib|version", path.join(__dirname, "commands", "cloud-lib-version"));

$injector.requireCommand("account|*list", path.join(__dirname, "commands", "account", "account-list"));
$injector.requireCommand("account|usage", path.join(__dirname, "commands", "account", "usage"));
$injector.requireCommand("account|features", path.join(__dirname, "commands", "account", "features"));

$injector.requireCommand("accept|eula", path.join(__dirname, "commands", "accept-eula-command"));

$injector.requireCommand("cloud|clean|workspace", path.join(__dirname, "commands", "clean", "clean-cloud-workspace"));
