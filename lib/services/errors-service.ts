import * as semver from "semver";

export class ErrorsService {
	private use61API: boolean;

	constructor(private $errors: IErrors,
		private $staticConfig: IStaticConfig) {
		const cliVersion = this.$staticConfig.version;

		this.use61API = semver.valid(cliVersion) && semver.gte(semver.coerce(cliVersion), "6.1.0");
	}

	fail(formatStr: string, ...args: any[]): never;
	fail(opts: IFailOptions, ...args: any[]): never;
	fail(opts: any, ...args: any[]) {
		if (this.use61API) {
			this.$errors.fail(opts, ...args);
		} else {
			this.$errors.failWithoutHelp(opts, ...args);
		}
	}

	failWithoutHelp(message: string, ...args: any[]): never;
	failWithoutHelp(opts: IFailOptions, ...args: any[]): never;
	failWithoutHelp(opts: any, ...args: any[]) {
		if (this.use61API) {
			this.$errors.fail(opts, ...args);
		} else {
			this.$errors.failWithoutHelp(opts, ...args);
		}
	}

	failWithHelp(formatStr: string, ...args: any[]): never;
	failWithHelp(opts: IFailOptions, ...args: any[]): never;
	failWithHelp(opts: any, ...args: any[]) {
		if (this.use61API) {
			this.$errors.failWithHelp(opts, ...args);
		} else {
			this.$errors.fail(opts, ...args);
		}
	}
}

$injector.register("nsCloudErrorsService", ErrorsService);
