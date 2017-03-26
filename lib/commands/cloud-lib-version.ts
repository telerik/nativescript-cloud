import * as path from "path";

export class CloudLibVersion implements ICommand {
	constructor(private $fs: IFileSystem,
		private $logger: ILogger) {
	}

	public allowedParameters: ICommandParameter[] = [];

	public async execute(args: string[]): Promise<void> {
		const pathToPackageJson = path.join(__dirname, "..", "..", "package.json");
		const packageJsonContent = this.$fs.readJson(pathToPackageJson);
		const version = packageJsonContent.version;

		this.$logger.info(version);
	}
}

$injector.registerCommand("cloud|lib|version", CloudLibVersion);
