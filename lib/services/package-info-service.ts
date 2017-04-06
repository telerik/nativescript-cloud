import { join } from "path";

export class PackageInfoService implements IPackageInfoService {
	constructor(private $fs: IFileSystem) {
	}

	public getVersion(): string {
		return this.getPackageJsonData().version;
	}

	private getPackageJsonData(): any {
		const pathToPackageJson = join(__dirname, "..", "..", "package.json");
		return this.$fs.readJson(pathToPackageJson);
	}
}

$injector.register("packageInfoService", PackageInfoService);
