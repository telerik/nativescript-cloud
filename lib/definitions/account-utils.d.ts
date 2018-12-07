interface IAccountUtils {
	isKinveyUser(): boolean;
	getKinveyAccountsMap(): Promise<IAccount[]>;
}
