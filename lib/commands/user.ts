import { EOL } from "os";
import { EulaConstants } from "../services/eula-service";
export class UserCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor(private $nsCloudUserService: IUserService,
		private $logger: ILogger,
		private $prompter: IPrompter,
		private $nsCloudEulaService: IEulaService) { }

	public async execute(args: string[]): Promise<void> {
		const shouldAcceptEula = await this.$nsCloudEulaService.shouldAcceptEula();
		if  (shouldAcceptEula) {

			this.$logger.printMarkdown(`You can read EULA here: \`${EulaConstants.eulaUrl}\`.`);
			const hasAcceptedEula = await this.$prompter.confirm("Do you accept EULA?");
			if (hasAcceptedEula) {
				await this.$nsCloudEulaService.acceptEula();
				console.log("check again: ");
				console.log("############### ", await this.$nsCloudEulaService.shouldAcceptEula());

			} else {
				throw new Error("###########11111111");
			}
		}

		const user = this.$nsCloudUserService.getUser();
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
