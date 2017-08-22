import * as path from "path";

$injector.require("httpServer", path.join(__dirname, "http-server"));
$injector.require("itmsServicesPlistHelper", path.join(__dirname, "itms-services-plist-helper"));
$injector.require("serverConfigManager", path.join(__dirname, "server-config-manager"));
$injector.require("cloudBuildOutputFilter", path.join(__dirname, "cloud-build-output-filter"));
$injector.require("cloudDeviceEmulator", path.join(__dirname, "cloud-device-emulator"));

// Mobile.
$injector.require("cloudEmulatorDeviceDiscovery", path.join(__dirname, "mobile", "mobile-core", "cloud-emulator-device-discovery"));

// Public API.
$injector.requirePublicClass("authenticationService", path.join(__dirname, "services", "authentication-service"));
$injector.requirePublicClass("cloudBuildService", path.join(__dirname, "services", "cloud-build-service"));
$injector.requirePublicClass("cloudEmulatorLauncher", path.join(__dirname, "services", "cloud-emulator-emulator-launcher"));
$injector.requirePublicClass("userService", path.join(__dirname, "services", "user-service"));
$injector.requirePublicClass("assetGenerationService", path.join(__dirname, "services", "asset-generation-service"));

// Services.
$injector.require("uploadService", path.join(__dirname, "services", "cloud-services", "upload-service"));
$injector.require("authCloudService", path.join(__dirname, "services", "cloud-services", "auth-cloud-service"));
$injector.require("buildCloudService", path.join(__dirname, "services", "cloud-services", "build-cloud-service"));
$injector.require("cloudServicesProxy", path.join(__dirname, "services", "cloud-services", "cloud-services-proxy"));
$injector.require("cloudRequestService", path.join(__dirname, "services", "cloud-services", "cloud-request-service"));
$injector.require("cloudEmulatorService", path.join(__dirname, "services", "cloud-services", "cloud-emulator-service"));
$injector.require("codeCommitService", path.join(__dirname, "services", "cloud-services", "code-commit-service"));
$injector.require("packageInfoService", path.join(__dirname, "services", "package-info-service"));
$injector.require("gitService", path.join(__dirname, "services", "git-service"));

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

$injector.requireCommand("build|cloud", path.join(__dirname, "commands", "cloud-build"));
$injector.requireCommand("cloud|lib|version", path.join(__dirname, "commands", "cloud-lib-version"));

const $devicesService: Mobile.IDevicesService = $injector.resolve("devicesService");
$devicesService.addDeviceDiscovery($injector.resolve("cloudEmulatorDeviceDiscovery"));
