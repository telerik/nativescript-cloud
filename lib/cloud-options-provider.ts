import { DEFAULT_ANDROID_PUBLISH_TRACK } from "./constants";

export class CloudOptionsProvider implements ICloudOptionsProvider {
	public get dashedOptions() {
		return {
			accountId: { type: OptionType.String, hasSensitiveValue: true },
			apiVersion: { type: OptionType.String, hasSensitiveValue: false },
			local: { type: OptionType.Boolean, hasSensitiveValue: false },
			serverProto: { type: OptionType.String , hasSensitiveValue: true},
			namespace: { type: OptionType.String, hasSensitiveValue: true },
			sharedCloud: { type: OptionType.Boolean, hasSensitiveValue: false },
			workflow: { type: OptionType.Object, hasSensitiveValue: true },
			vmTemplateName: { type: OptionType.String, hasSensitiveValue: false },
			track: { type: OptionType.String, default: DEFAULT_ANDROID_PUBLISH_TRACK, hasSensitiveValue: false },
		};
	}
}
$injector.register("nsCloudOptionsProvider", CloudOptionsProvider);
