export class HashService implements IHashService {
	constructor(private $fs: IFileSystem) { }

	public async getLocalFileHash(pathToFile: string): Promise<string> {
		if (pathToFile) {
			return this.$fs.getFileShasum(pathToFile, { algorithm: "sha256", encoding: "hex" });
		}

		return null;
	}
}

$injector.register("nsCloudHashService", HashService);
