import { EOL } from "os";

export class CloudOutputFilter implements ICloudOutputFilter {
	public filter(logs: string): string {
		let result = this.filterBpcMetadata(logs)
			.replace(new RegExp("(\\\\r\\\\n)|(\\\\n)", "gm"), EOL) // Unescape new lines.
			.replace(/(\\\\t)/g, "\t") // Unescape tabs.
			.replace(/((\n)|(\r\n)){1,}/gm, EOL) // Replace consecutive blank lines.
			.replace(/\\u001b\[0G/g, "\u001b") // Unescape the escape character.
			.trim();

		// The logs in S3 have "" around the whole content. We don't need them.
		if (result) {
			if (result.startsWith(`"`)) {
				result = result.substr(1);
			}

			if (result.endsWith(`"`)) {
				result = result.substr(0, result.length - 1);
			}
		}

		return result;
	}

	public filterBpcMetadata(logs: string): string {
		return logs.replace(/\[(([0-9]){2,2}:){2,2}[0-9].\.[0-9]*\]\W*?\[.*?\] {0,3}/g, ""); // Replace the log timestamp and log level.
	}
}

$injector.register("nsCloudOutputFilter", CloudOutputFilter);
