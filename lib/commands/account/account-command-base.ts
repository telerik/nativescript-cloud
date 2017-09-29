export class AccountCommandBase {
	constructor(private $errors: IErrors,
		private $userService: IUserService) { }

	public async canExecute(args: string[]): Promise<boolean> {
		if (!this.$userService.hasUser()) {
			this.$errors.failWithoutHelp("You are not logged in.");
		}

		return true;
	}
}
