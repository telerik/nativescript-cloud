import * as uuid from "uuid";

import { BUILD_SERVICE_NAME, HTTP_METHODS } from "../../constants";
import { CloudServiceBase } from "./cloud-service-base";

export class UploadService extends CloudServiceBase implements IUploadService {

	protected serviceName = BUILD_SERVICE_NAME;

	constructor(protected $cloudRequestService: ICloudRequestService,
		private $httpClient: Server.IHttpClient,
		private $errors: IErrors,
		private $fs: IFileSystem) {
		super($cloudRequestService);
	}

	public async uploadToS3(filePathOrContent: string, fileNameInS3?: string, uploadPreSignedUrl?: string): Promise<string> {
		fileNameInS3 = fileNameInS3 || uuid.v4();
		let preSignedUrlData: IPresignURLResponse;
		if (!uploadPreSignedUrl) {
			preSignedUrlData = await this.sendRequest<IPresignURLResponse>(HTTP_METHODS.GET, `api/get-upload-url?fileName=${fileNameInS3}`, {});
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
