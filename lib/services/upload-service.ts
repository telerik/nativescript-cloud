import * as uuid from "uuid";

import { BUILD_SERVICE_NAME, HTTP_METHODS } from "../constants";

export class UploadService implements IUploadService {

	protected serviceName = BUILD_SERVICE_NAME;

	constructor(private $buildCloudService: IBuildCloudService,
		private $httpClient: Server.IHttpClient,
		private $errors: IErrors,
		private $fs: IFileSystem) {
	}

	public async uploadToS3(filePathOrContent: string, fileNameInS3?: string, uploadPreSignedUrl?: string): Promise<string> {
		fileNameInS3 = fileNameInS3 || uuid.v4();
		let preSignedUrlData: IAmazonStorageEntry;
		if (!uploadPreSignedUrl) {
			preSignedUrlData = await this.$buildCloudService.getPresignedUploadUrlObject(fileNameInS3);
			uploadPreSignedUrl = preSignedUrlData.uploadPreSignedUrl;
		}

		const requestOpts: any = {
			url: uploadPreSignedUrl,
			method: HTTP_METHODS.PUT
		};

		if (this.$fs.exists(filePathOrContent)) {
			requestOpts.body = this.$fs.readFile(filePathOrContent);
		} else {
			requestOpts.body = filePathOrContent;
		}

		requestOpts.headers = requestOpts.headers || {};
		// It is vital we set this, else the http request comes out as chunked and S3 doesn't support chunked requests
		requestOpts.headers["Content-Length"] = requestOpts.body.length;

		try {
			await this.$httpClient.httpRequest(requestOpts);
		} catch (err) {
			this.$errors.failWithoutHelp(`Error while uploading ${filePathOrContent} to S3. Errors is:`, err.message);
		}

		return preSignedUrlData && preSignedUrlData.publicDownloadUrl;
	}
}

$injector.register("uploadService", UploadService);
