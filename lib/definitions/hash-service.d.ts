/**
 * Describes methods for working with file hashes.
 */
interface IHashService {
	/**
	 * Returhs the hash of the content of the provided file.
	 * @param pathToFile Path to the local file.
	 */
	getLocalFileHash(pathToFile: string): Promise<string>;
}
