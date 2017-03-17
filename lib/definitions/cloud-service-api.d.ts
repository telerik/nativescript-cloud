// Disable rules for interfaces as these are generated based on Server API.
/* tslint:disable:interface-name */
declare module CloudService {
	interface IServer {
		appsBuild: CloudService.IAppsBuildServiceContract;
	}

	interface IRequestBodyElement {
		name: string;
		value: any;
		contentType: string;
	}

	interface IServiceProxy {
		call<T>(name: string, method: string, path: string, accept: string, body: IRequestBodyElement[], resultStream: NodeJS.WritableStream, headers?: any): Promise<T>;
	}

	interface IAppsBuildServiceContract {
		buildProject(appId: string, buildRequest: CloudService.BuildRequestData): Promise<CloudService.Object>;
		getPresignedUploadUrlObject(appId: string, fileName: string): Promise<CloudService.AmazonStorageEntry>;
	}

	interface TaskItemData {
		ItemSpec: string;
		Properties: IDictionary<string>;
		Comparer: any;
		Count: number;
		Keys: string[];
		Values: string[];
		Item: string;
	}
	interface TargetResultData {
		Status: string;
		Items: TaskItemData[];
	}

	interface Object {
	}

	interface BuildIssueData {
		Code: string;
		File: string;
		ProjectFile: string;
		Target: string;
		Message: string;
		LineNumber: number;
		ColumnNumber: number;
		EndLineNumber: number;
		EndColumnNumber: number;
		IsRealError: boolean;
	}

	interface BuildResultData {
		Errors: CloudService.BuildIssueData[];
		Warnings: CloudService.BuildIssueData[];
		Output: string;
		ResultsByTarget: IDictionary<TargetResultData>;
	}

	interface BuildFile {
		Disposition: string;
		SourceUri: string;
	}

	interface BuildRequestData {
		Targets: string[];
		Properties: IDictionary<string>;
		BuildFiles: CloudService.BuildFile[];
	}

	interface AmazonStorageEntry {
		UploadPreSignedUrl: string;
		PublicDownloadUrl: string;
		S3Url: string;
		SessionKey: string;
	}
}
/* tslint:enable:interface-name */
