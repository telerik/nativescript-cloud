import { AccountCommandBase } from "./account-command-base";
import { createTable } from "../../helpers";

export class AccountListCommand extends AccountCommandBase implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor($errors: IErrors,
		$nsCloudUserService: IUserService,
		private $nsCloudAccountsService: IAccountsService,
		private $logger: ILogger) {
		super($errors, $nsCloudUserService);
	}

	public async execute(args: string[]): Promise<void> {
		const myAccounts = await this.$nsCloudAccountsService.getMyAccounts();
		const table = createTable(["#", "Id", "Account", "Type"], myAccounts.map((a, i) => {
			const index = i + 1;
			return [index.toString(), a.id, a.name, a.type];
		}));

		this.$logger.out(table.toString());
	}
}

$injector.registerCommand("account|*list", AccountListCommand);
