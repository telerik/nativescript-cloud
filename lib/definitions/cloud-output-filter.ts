interface ICloudOutputFilter {
	filter(data: string): string;
	filterBpcMetadata(logs: string): string;
}
