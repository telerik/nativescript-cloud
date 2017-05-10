import * as path from "path";

$injector.require("itmsServicesPlistHelper", path.join(__dirname, "itms-services-plist-helper"));
$injector.require("serverConfigManager", path.join(__dirname, "server-config-manager"));
$injector.require("httpServer", path.join(__dirname, "http-server"));

// Public API.
$injector.requirePublicClass("authenticationService", path.join(__dirname, "services", "authentication-service"));
$injector.requirePublicClass("cloudBuildService", path.join(__dirname, "services", "cloud-build-service"));

// Services.
$injector.require("userService", path.join(__dirname, "services", "user-service"));
$injector.require("cloudServicesProxy", path.join(__dirname, "services", "cloud-services", "cloud-services-proxy"));
$injector.require("cloudAuthService", path.join(__dirname, "services", "cloud-services", "cloud-auth-service"));
$injector.require("packageInfoService", path.join(__dirname, "services", "package-info-service"));

// Commands.
$injector.requireCommand("config|*get", path.join(__dirname, "commands", "config", "config-get"));
$injector.requireCommand("config|apply", path.join(__dirname, "commands", "config", "config-apply"));
$injector.requireCommand("config|reset", path.join(__dirname, "commands", "config", "config-reset"));
$injector.requireCommand("config|set", path.join(__dirname, "commands", "config", "config-set"));

$injector.requireCommand("login", path.join(__dirname, "commands", "login"));
$injector.requireCommand("logout", path.join(__dirname, "commands", "logout"));
$injector.requireCommand("dev-login", path.join(__dirname, "commands", "dev-login"));

$injector.requireCommand("user", path.join(__dirname, "commands", "user"));

$injector.requireCommand("build|cloud", path.join(__dirname, "commands", "cloud-build"));
$injector.requireCommand("cloud|lib|version", path.join(__dirname, "commands", "cloud-lib-version"));
