import { EOL } from "os";

export class UserCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor(private $userService: IUserService,
		private $logger: ILogger) { }

	public async execute(args: string[]): Promise<void> {
		const user = this.$userService.getUser();
		let message: string;

		if (!user) {
			message = "You are not logged in.";
		} else {
			message = `Current user: ${EOL}E-mail: ${user.email}${EOL}First name: ${user.firstName}${EOL}Last name: ${user.lastName}`;
		}

		this.$logger.info(message);
	}
}

$injector.registerCommand("user", UserCommand);
