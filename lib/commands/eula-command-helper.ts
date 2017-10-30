import { EulaConstants } from "../constants";
import { isInteractive } from "../helpers";

export class EulaCommandHelper implements IEulaCommandHelper {
	constructor(private $errors: IErrors,
		private $logger: ILogger,
		private $nsCloudEulaService: IEulaService,
		private $prompter: IPrompter) { }

	public acceptEula(): Promise<void> {
		this.$logger.printMarkdown(`Accepting EULA located at ${EulaConstants.eulaUrl}.`);
		return this.$nsCloudEulaService.acceptEula();
	}

	public async ensureEulaIsAccepted(): Promise<void> {
		const eulaData = await this.$nsCloudEulaService.getEulaDataWithCache();
		if (!eulaData.shouldAcceptEula) {
			this.$logger.trace("Ensure EULA accepted: no need to accept EULA - already accepted.");
			return;
		}

		this.$logger.printMarkdown(`In order to use cloud services, you must accept our EULA. You can read it here: ${EulaConstants.eulaUrl}.`);

		const actionOnError = () => this.$errors.failWithoutHelp("You cannot use cloud services without accepting the EULA.");

		if (!isInteractive()) {
			return actionOnError();
		}

		const hasAcceptedEula = await this.$prompter.confirm("Do you accept the EULA?");

		if (!hasAcceptedEula) {
			return actionOnError();
		}

		await this.$nsCloudEulaService.acceptEula();
	}
}

$injector.register("nsCloudEulaCommandHelper", EulaCommandHelper);
