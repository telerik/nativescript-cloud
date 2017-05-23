import * as uuid from "uuid";

import { BUILD_SERVICE_NAME } from "../../constants";
import { CloudServiceBase } from "./cloud-service-base";

export class UploadService extends CloudServiceBase implements IUploadService {

	protected serviceName = BUILD_SERVICE_NAME;

	constructor(protected $cloudRequestService: ICloudRequestService,
		private $httpClient: Server.IHttpClient,
		private $errors: IErrors,
		private $fs: IFileSystem) {
		super($cloudRequestService);
	}

	public async updloadToS3(localFilePath: string): Promise<string> {
		const fileNameInS3 = uuid.v4();
		const preSignedUrlData = await this.sendRequest<IPresignURLResponse>("GET", `api/get-upload-url?filename=${fileNameInS3}`, {});
		const requestOpts: any = {
			url: preSignedUrlData.uploadPreSignedUrl,
			method: "PUT"
		};

		requestOpts.body = this.$fs.readFile(localFilePath);
		requestOpts.headers = requestOpts.headers || {};
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
