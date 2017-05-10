import * as path from "path";

$injector.requirePublicClass("cloudBuildService", path.join(__dirname, "services", "cloud-build-service"));
$injector.require("serviceProxy", path.join(__dirname, "services", "service-proxy"));
$injector.require("packageInfoService", path.join(__dirname, "services", "package-info-service"));
$injector.require("serverConfig", path.join(__dirname, "server-config"));
$injector.require("itmsServicesPlistHelper", path.join(__dirname, "itms-services-plist-helper"));
$injector.require("server", path.join(__dirname, "services", "cloud-service"));
$injector.requireCommand("build|cloud", path.join(__dirname, "commands", "cloud-build"));
$injector.requireCommand("cloud|lib|version", path.join(__dirname, "commands", "cloud-lib-version"));
