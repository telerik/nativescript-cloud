import { AccountCommandBase } from "./account-command-base";
import { createTable, stringifyWithIndentation } from "../../helpers";

export class FeaturesCommand extends AccountCommandBase implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	public get dashedOptions() {
		return this.$nsCloudOptionsProvider.dashedOptions;
	}

	constructor($nsCloudErrorsService: IErrors,
		$nsCloudUserService: IUserService,
		private $nsCloudAccountsService: IServerAccountsService,
		private $nsCloudEulaCommandHelper: IEulaCommandHelper,
		private $nsCloudOptionsProvider: ICloudOptionsProvider,
		private $options: ICloudOptions,
		private $logger: ILogger) {
		super($nsCloudErrorsService, $nsCloudUserService);
	}

	public async execute(args: string[]): Promise<void> {
		await this.$nsCloudEulaCommandHelper.ensureEulaIsAccepted();

		const features = await this.$nsCloudAccountsService.getAccountFeatures(this.$options.accountId);
		let output: string;

		if (this.$options.json) {
			output = stringifyWithIndentation(features);
		} else {
			const table = createTable([`Feature`, `Enabled`], _.map(features, feature => {
				return [feature.feature, feature.enabled.toString()];
			}));

			output = table.toString();
		}

		this.$logger.info(output);
	}
}

$injector.registerCommand("account|features", FeaturesCommand);
