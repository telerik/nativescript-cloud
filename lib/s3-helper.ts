export class S3Helper implements IS3Helper {
	constructor(private $httpClient: Server.IHttpClient) { }

	public async getJsonObjectFromS3File<T>(pathToFile: string): Promise<T> {
		return JSON.parse(await this.getContentOfS3File(pathToFile));
	}

	public async getContentOfS3File(pathToFile: string): Promise<string> {
		return (await this.$httpClient.httpRequest(pathToFile)).body;
	}
}

$injector.register("nsCloudS3Helper", S3Helper);
