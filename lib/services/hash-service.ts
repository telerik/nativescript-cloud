import * as crypto from "crypto";

export class HashService implements IHashService {
	constructor(private $fs: IFileSystem) { }

	public async getLocalFileHash(pathToFile: string): Promise<string> {
		if (pathToFile) {
			return this.$fs.getFileShasum(pathToFile, { algorithm: "sha256", encoding: "hex" });
		}

		return null;
	}

	public getHash(str: string, options?: { algorithm?: string, encoding?: crypto.HexBase64Latin1Encoding }): string {
		return crypto.createHash(options && options.algorithm || 'sha256').update(str).digest(options && options.encoding || 'hex');
	}
}

$injector.register("nsCloudHashService", HashService);
