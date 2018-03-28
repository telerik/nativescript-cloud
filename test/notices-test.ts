import * as fs from "fs";
import * as path from "path";
import * as semver from "semver";
import { assert } from "chai";

describe("NOTICE.txt", () => {
	it("validates file version is compatible with cloud version", () => {
		const pathToPackageJson = path.join(__dirname, "..", "package.json");
		const packageJsonContent = fs.readFileSync(pathToPackageJson, "utf8");
		const versionInPackageJson: string = JSON.parse(packageJsonContent).version;

		const pathToNotices = path.join(__dirname, "..", "NOTICE.txt");
		const noticesText = fs.readFileSync(pathToNotices).toString();
		const regex = /NativeScript Cloud v(\d)+\*/g;
		const match = regex.exec(noticesText);
		const versionInNotices = (match && match[1]) || "";
		const majorVersionInPackageJson = semver.major(versionInPackageJson).toString();
		assert.equal(versionInNotices, majorVersionInPackageJson, `Major version in package.json (${majorVersionInPackageJson}) MUST be the same as the version mentioned in notices.txt (${versionInNotices}).`);
	});
});
