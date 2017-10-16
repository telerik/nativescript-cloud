import { EOL } from "os";
import { AccountCommandBase } from "./account-command-base";
import { UNLIMITED } from "../../constants";
import { createTable, stringifyWithIndentation } from "../../helpers";

export class UsageCommand extends AccountCommandBase implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	public get dashedOptions() {
		return this.$nsCloudOptionsProvider.dashedOptions;
	}

	constructor($errors: IErrors,
		$nsCloudUserService: IUserService,
		private $nsCloudAccountsService: IAccountsCloudService,
		private $nsCloudOptionsProvider: ICloudOptionsProvider,
		private $options: ICloudOptions,
		private $logger: ILogger) {
		super($errors, $nsCloudUserService);
	}

	public async execute(args: string[]): Promise<void> {
		const usage = await this.$nsCloudAccountsService.getUsageInfo(this.$options.accountId);
		let output: string;

		const groupedUsage = _(usage)
			.map(u => {
				const result: IFeatureUsage = {
					feature: u.feature,
					allowedUsage: u.allowedUsage,
					performed: u.usage,
					remaining: u.unlimited ? u.allowedUsage : u.allowedUsage - u.usage,
					unlimited: !!u.unlimited
				};

				return result;
			})
			.groupBy(u => u.feature)
			.value();

		if (this.$options.json) {
			output = stringifyWithIndentation(groupedUsage);
		} else {
			const tables = _.map(groupedUsage, (g, feature) => {
				return createTable([`${feature} performed`, `${feature} remaining`], g.map(u => {
					const result = [u.performed.toString()];
					if (u.unlimited) {
						result.push(UNLIMITED);
					} else {
						const remainingUsage = u.allowedUsage - u.performed;
						result.push(remainingUsage.toString());
					}

					return result;
				}));
			});

			output = tables.join(EOL);
		}

		this.$logger.out(output);
	}
}

$injector.registerCommand("account|usage", UsageCommand);
