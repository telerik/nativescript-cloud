type HexBase64Latin1Encoding = "latin1" | "hex" | "base64";

/**
 * Describes methods for working with hashes.
 */
interface IHashService {
	/**
	 * Returns the hash of the content of the provided file.
	 * @param pathToFile Path to the local file.
	 */
	getLocalFileHash(pathToFile: string): Promise<string>;

	/**
	 * Returns the hash of the provided string.
	 * @param str String which will be hashed.
	 * @param options Hash options.
	 */
	getHash(str: string, options?: { algorithm?: string, encoding?: HexBase64Latin1Encoding }): string
}
