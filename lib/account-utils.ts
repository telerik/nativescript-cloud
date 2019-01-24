import { NAMESPACE_LOWER_CASE } from "./constants";

import { isKinveyNamespace } from "./helpers";

export class AccountUtils implements IAccountUtils {
	private get $nsCloudKinveyService(): IKinveyService {
		return this.$injector.resolve<IKinveyService>("nsCloudKinveyService");
	}

	constructor(private $nsCloudConfigManager: ICloudConfigManager,
		private $injector: IInjector, ) { }

	public isKinveyUser(): boolean {
		const serverConfig = this.$nsCloudConfigManager.getCurrentConfigData();
		const namespace: string = serverConfig[NAMESPACE_LOWER_CASE];
		return isKinveyNamespace(namespace);
	}

	public async getKinveyAccountsMap(): Promise<IAccount[]> {
		return (await this.$nsCloudKinveyService.getApps()).map(a => ({ id: a.id, name: a.name, type: a.plan && a.plan.level }));
	}
}

$injector.register("nsAccountUtils", AccountUtils);
