import * as uuid from "uuid";

import { MISC_SERVICE_NAME } from "../../constants";
import { CloudServiceBase } from "./cloud-service-base";

export class UploadService extends CloudServiceBase implements IUploadService {

	protected serviceName = MISC_SERVICE_NAME;

	constructor(protected $cloudRequestService: ICloudRequestService,
		private $httpClient: Server.IHttpClient,
		private $errors: IErrors,
		private $fs: IFileSystem) {
		super($cloudRequestService);
	}

	public async uploadToS3(localFilePath: string, requestHeaders?: any): Promise<string> {
		//const fileNameInS3 = uuid.v4();
		//const preSignedUrlData = await this.sendRequest<IPresignURLResponse>("GET", `api/upload-url?filename=${fileNameInS3}`, {});
		const preSignedUrlData = {
			uploadPreSignedUrl: "https://ab-tmp-dev.s3-eu-west-1.amazonaws.com/img.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIAI7MV6WTJQPCRFSKQ%2F20170822%2Feu-west-1%2Fs3%2Faws4_request&X-Amz-Date=20170822T143828Z&X-Amz-Expires=604800&X-Amz-SignedHeaders=host&X-Amz-Signature=ffcd9242ce1d59e739f4ef644712fb87b236d8d2066738152ccf3c064bafb032",
			publicDownloadUrl: "https://ab-tmp-dev.s3-eu-west-1.amazonaws.com/img.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIAI7MV6WTJQPCRFSKQ%2F20170822%2Feu-west-1%2Fs3%2Faws4_request&X-Amz-Date=20170822T135840Z&X-Amz-Expires=604800&X-Amz-SignedHeaders=host&X-Amz-Signature=c23550d8160f9b98e7a61756980364e1d6403f2cd76ebf66cc8c71c1b5991bf6"
		};
		const requestOpts: any = {
			url: preSignedUrlData.uploadPreSignedUrl,
			method: "PUT",
			headers: requestHeaders || {},
			body: this.$fs.readFile(localFilePath)
		};

		// It is vital we set this, else the http request comes out as chunked and S3 doesn't support chunked requests
		requestOpts.headers["Content-Length"] = requestOpts.body.length;

		try {
			await this.$httpClient.httpRequest(requestOpts);
		} catch (err) {
			this.$errors.failWithoutHelp(`Error while uploading ${localFilePath} to S3. Errors is:`, err.message);
		}

		return preSignedUrlData.publicDownloadUrl;
	}
}

$injector.register("uploadService", UploadService);
