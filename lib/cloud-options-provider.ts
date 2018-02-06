import { DEFAULT_ANDROID_PUBLISH_TRACK } from "./constants";

export class CloudOptionsProvider implements ICloudOptionsProvider {
	public get dashedOptions() {
		return {
			accountId: { type: OptionType.String },
			apiVersion: { type: OptionType.String },
			local: { type: OptionType.Boolean },
			serverProto: { type: OptionType.String },
			sharedCloud: { type: OptionType.Boolean },
			track: { type: OptionType.String, default: DEFAULT_ANDROID_PUBLISH_TRACK },
		};
	}
}
$injector.register("nsCloudOptionsProvider", CloudOptionsProvider);
