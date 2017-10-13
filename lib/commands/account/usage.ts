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

		if (this.$options.json) {
			output = stringifyWithIndentation(usage);
		} else {
			const table = createTable(["Feature", "Remaining usage"], usage.map(u => {
				const result = [u.feature];
				if (u.unlimited) {
					result.push(UNLIMITED);
				} else {
					const remainingUsage = u.allowedUsage - u.usage;
					result.push(remainingUsage.toString());
				}

				return result;
			}));

			output = table.toString();
		}

		this.$logger.out(output);
	}
}

$injector.registerCommand("account|usage", UsageCommand);
