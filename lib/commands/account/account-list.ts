import { AccountCommandBase } from "./account-command-base";
import { createTable, stringifyWithIndentation } from "../../helpers";

export class AccountListCommand extends AccountCommandBase implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor($errors: IErrors,
		$nsCloudUserService: IUserService,
		private $nsCloudEulaCommandHelper: IEulaCommandHelper,
		private $nsCloudAccountsService: IAccountsService,
		private $logger: ILogger,
		private $options: IOptions) {
		super($errors, $nsCloudUserService);
	}

	public async execute(args: string[]): Promise<void> {
		await this.$nsCloudEulaCommandHelper.ensureEulaIsAccepted();

		const myAccounts = await this.$nsCloudAccountsService.getMyAccounts();
		let output: string;

		if (this.$options.json) {
			output = stringifyWithIndentation(myAccounts);
		} else {
			const table = createTable(["#", "Id", "Account", "Type"], myAccounts.map((a, i) => {
				const index = i + 1;
				return [index.toString(), a.id, a.name, a.type];
			}));

			output = table.toString();
		}

		this.$logger.out(output);
	}
}

$injector.registerCommand("account|*list", AccountListCommand);
