"use strict";

const path = require("path");
const fs = require("fs");
const childProcess = require("child_process");
const _ = require("lodash");
const os = require("os");
const nodeArgs = [];
const getBuildVersion = (version) => {
	let buildVersion = version !== undefined ? version : process.env["BUILD_NUMBER"];
	if (process.env["BUILD_CAUSE_GHPRBCAUSE"]) {
		buildVersion = "PR" + buildVersion;
	}

	return buildVersion;
}

module.exports = function (grunt) {

	// Windows cmd does not accept paths with / and unix shell does not accept paths with \\ and we need to execute from a sub-dir.
	// To circumvent the issue, hack our environment's PATH and let the OS deal with it, which in practice works
	process.env.path = process.env.path + (os.platform() === "win32" ? ";" : ":") + "node_modules/.bin";

	const defaultEnvironment = "sit";

	grunt.initConfig({
		deploymentEnvironment: process.env["DeploymentEnvironment"] || defaultEnvironment,
		resourceDownloadEnvironment: process.env["ResourceDownloadEnvironment"] || defaultEnvironment,
		jobName: process.env["JOB_NAME"] || defaultEnvironment,
		buildNumber: process.env["BUILD_NUMBER"] || "non-ci",

		pkg: grunt.file.readJSON("package.json"),
		ts: {
			options: grunt.file.readJSON("tsconfig.json").compilerOptions,

			devlib: {
				src: ["lib/**/*.ts", "test/**/*.ts", "references.d.ts", "!node_modules/**/*"]
			},

			release_build: {
				src: ["lib/**/*.ts", "test/**/*.ts", "references.d.ts", "!node_modules/**/*"],
				options: {
					sourceMap: false,
					removeComments: true
				}
			}
		},

		tslint: {
			build: {
				files: {
					src: ["lib/**/*.ts", "test/**/*.ts", "definitions/**/*.ts"]
				},
				options: {
					configuration: grunt.file.readJSON("./tslint.json")
				}
			}
		},

		watch: {
			devall: {
				files: ["lib/**/*.ts", "test/**/*.ts"],
				tasks: ['ts:devlib'],
				options: {
					atBegin: true,
					interrupt: true
				}
			}
		},

		shell: {
			options: {
				stdout: true,
				stderr: true
			},

			ci_unit_tests: {
				command: "npm test",
				options: {
					execOptions: {
						env: (function () {
							var env = _.cloneDeep(process.env);
							env["XUNIT_FILE"] = "test-reports.xml";
							env["LOG_XUNIT"] = "true";
							return env;
						})()
					}
				}
			},

			apply_deployment_environment: {
				command: "node " + nodeArgs.join(" ") + " bin/appbuilder dev-config-apply <%= deploymentEnvironment %>"
			},

			build_package: {
				command: "npm pack",
				options: {
					execOptions: {
						env: (function () {
							var env = _.cloneDeep(process.env);
							env["APPBUILDER_SKIP_POSTINSTALL_TASKS"] = "1";
							return env;
						})()
					}
				}
			}
		},

		clean: {
			src: ["test/**/*.js*",
				"lib/**/*.js*",
				"*.tgz"]
		}
	});

	grunt.loadNpmTasks("grunt-contrib-clean");
	grunt.loadNpmTasks("grunt-contrib-watch");
	grunt.loadNpmTasks("grunt-shell");
	grunt.loadNpmTasks("grunt-ts");
	grunt.loadNpmTasks("grunt-tslint");

	grunt.registerTask("set_package_version", function (version) {
		const buildVersion = getBuildVersion(version);
		const packageJson = grunt.file.readJSON("package.json");
		packageJson.buildVersion = buildVersion;
		grunt.file.write("package.json", JSON.stringify(packageJson, null, "  "));
	});

	const transpileProject = function (dirname) {
		const pathToModule = path.join(__dirname, "node_modules", dirname);
		const packageJsonContent = grunt.file.readJSON(path.join(pathToModule, "package.json"));

		try {
			// Keep the --production flag - in case we skip it, we'll instal istanbul, chai, etc. and their .d.ts will conflict with ours.
			childProcess.execSync("npm i --ignore-scripts --production", { cwd: pathToModule, stdio: "ignore" });
		} catch (err) {
		}

		try {
			// grunt deps must be installed locally in the project where grunt will be called.
			// also for transpilation we need typescript locally.
			const searchedNames = ["grunt", "typescript"];
			const dependenciesToInstall = _.map(packageJsonContent.devDependencies, (version, name) => {
				for (let searchedName of searchedNames) {
					if (name.indexOf(searchedName) !== -1 && !fs.existsSync(path.join(pathToModule, "node_modules", name))) {
						return `${name}@${version}`
					}
				}
			}).filter(a => !!a);

			_.each(dependenciesToInstall, name => {
				try {
					childProcess.execSync(`npm i --ignore-scripts --production ${name}`, { cwd: pathToModule, stdio: "ignore" });
				} catch (err) {
				}
			})


		} catch (err) { }

		try {
			// we need the .js file in the tests, so we can require them, for example in order to create a new instance of injector.
			// if the main file is .js and it exists, no need to transpile it again
			const pathToMain = path.join(pathToModule, packageJsonContent.main);
			if (!fs.existsSync(pathToMain)) {
				childProcess.execSync("grunt", { cwd: pathToModule, stdio: "ignore" });
			}
		} catch (err) { }
	};

	grunt.registerTask("transpile_additional_project", function () {
		transpileProject("nativescript");
		transpileProject("mobile-cli-lib");
	});

	grunt.registerTask("setPackageName", function (version) {
		const fs = require("fs");
		const fileExtension = ".tgz";
		const buildVersion = getBuildVersion(version);
		const packageJson = grunt.file.readJSON("package.json");
		const oldFileName = packageJson.name + "-" + packageJson.version;
		const newFileName = oldFileName + "-" + buildVersion;
		fs.renameSync(oldFileName + fileExtension, newFileName + fileExtension);
	});

	grunt.registerTask("delete_coverage_dir", function () {
		const done = this.async();
		const rimraf = require("rimraf");
		rimraf("coverage", function (err) {
			if (err) {
				console.log("Error while deleting coverage directory from the package.");
				done(false);
			}

			done();
		});
	});

	grunt.registerTask("test", ["transpile_additional_project", "generate_references", "ts:devlib", "shell:ci_unit_tests"]);

	grunt.registerTask("generate_references", () => {
		const referencesPath = path.join(__dirname, "references.d.ts");

		// get all .d.ts files from nativescript-cli and mobile-cli-lib
		const node_modules = "node_modules";
		const nativescript = "nativescript";
		const iOSDeviceLib = "ios-device-lib";
		const nodeModulesDirPath = path.join(__dirname, node_modules);
		const rootPathToIosDeviceLib = path.join(nodeModulesDirPath, iOSDeviceLib);
		const pathToIosDeviceLib = fs.existsSync(rootPathToIosDeviceLib) ? rootPathToIosDeviceLib : path.join(nodeModulesDirPath, nativescript, node_modules, iOSDeviceLib);

		const pathsOfDtsFiles = getReferencesFromDir(path.join(nodeModulesDirPath, nativescript))
			.concat(getReferencesFromDir(path.join(nodeModulesDirPath, "mobile-cli-lib")))
			.concat(getReferencesFromDir(pathToIosDeviceLib))
			.concat(getReferencesFromDir(path.join(nodeModulesDirPath, "cloud-device-emulator")));

		const lines = pathsOfDtsFiles.map(file => `/// <reference path="${fromWindowsRelativePathToUnix(path.relative(__dirname, file))}" />`);

		fs.writeFileSync(referencesPath, lines.join(os.EOL));
	});

	const fromWindowsRelativePathToUnix = (windowsRelativePath) => {
		return windowsRelativePath.replace(/\\/g, "/");
	}

	// returns paths that have to be added to reference.d.ts.
	const getReferencesFromDir = (dir) => {
		const currentDirContent = fs.readdirSync(dir).map(item => path.join(dir, item));
		let pathsToDtsFiles = [];
		_.each(currentDirContent, d => {
			const stat = fs.statSync(d);
			if (stat.isDirectory() && path.basename(d) !== "node_modules") {
				// recursively check all dirs for .d.ts files.
				pathsToDtsFiles = pathsToDtsFiles.concat(getReferencesFromDir(d));
			} else if (stat.isFile() && d.endsWith(".d.ts") && path.basename(d) !== ".d.ts") {
				pathsToDtsFiles.push(d);
			}
		});

		return pathsToDtsFiles;
	};

	grunt.registerTask("pack", [
		"clean",
		"generate_references",
		"ts:release_build",
		"transpile_additional_project",
		"shell:ci_unit_tests",
		"tslint:build",

		"set_package_version",
		"delete_coverage_dir",
		"shell:build_package",
		"setPackageName"
	]);
	grunt.registerTask("lint", ["tslint:build"]);
	grunt.registerTask("all", ["clean", "test", "lint"]);
	grunt.registerTask("rebuild", ["clean", "ts:devlib"]);
	grunt.registerTask("default", ["generate_references", "ts:devlib"]);
};
