const xmlEscape = require("xml-escape");

export class ItmsServicesPlistHelper implements IItmsServicesPlistHelper { // User specific config
	public createPlistContent(options: IItmsPlistOptions): string {
		return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>items</key>
	<array>
		<dict>
			<key>assets</key>
			<array>
				<dict>
					<key>kind</key>
					<string>software-package</string>
					<key>url</key>
					<string>${xmlEscape(options.url)}</string>
				</dict>
			</array>
			<key>metadata</key>
			<dict>
				<key>bundle-identifier</key>
				<string>${options.projectId}</string>
				<key>kind</key>
				<string>software</string>
				<key>title</key>
				<string>${options.projectName}</string>
			</dict>
		</dict>
	</array>
</dict>
</plist>`;
	}
}

$injector.register("nsCloudItmsServicesPlistHelper", ItmsServicesPlistHelper);
