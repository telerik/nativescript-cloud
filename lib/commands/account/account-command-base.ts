export class AccountCommandBase {
	constructor(private $nsCloudErrorsService: IErrors,
		private $nsCloudUserService: IUserService) { }

	public async canExecute(args: string[]): Promise<boolean> {
		if (!this.$nsCloudUserService.hasUser()) {
			this.$nsCloudErrorsService.fail("You are not logged in.");
		}

		return true;
	}
}
