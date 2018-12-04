import { DEFAULT_ANDROID_PUBLISH_TRACK } from "./constants";

export class CloudOptionsProvider implements ICloudOptionsProvider {
	public get dashedOptions() {
		return {
			accountId: { type: OptionType.String },
			apiVersion: { type: OptionType.String },
			local: { type: OptionType.Boolean },
			serverProto: { type: OptionType.String },
			namespace: { type: OptionType.String },
			sharedCloud: { type: OptionType.Boolean },
			workflow: { type: OptionType.Object },
			vmTemplateName: { type: OptionType.String },
			track: { type: OptionType.String, default: DEFAULT_ANDROID_PUBLISH_TRACK },
		};
	}
}
$injector.register("nsCloudOptionsProvider", CloudOptionsProvider);
