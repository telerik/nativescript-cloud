export class AccountCommandBase {
	constructor(private $errors: IErrors,
		private $nsCloudUserService: IUserService) { }

	public async canExecute(args: string[]): Promise<boolean> {
		if (!this.$nsCloudUserService.hasUser()) {
			this.$errors.failWithoutHelp("You are not logged in.");
		}

		return true;
	}
}
