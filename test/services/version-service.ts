import { VersionService } from "../../lib/services/version-service";
import { Yok } from "mobile-cli-lib/yok";
import { assert } from "chai";

const TNS_CLI_CLOUD_VERSION_ORIGINAL = process.env.TNS_CLI_CLOUD_VERSION;
describe("versionService", () => {
	const createTestInjector = (): IInjector => {
		const testInjector = new Yok();
		testInjector.register("logger", {
			trace: (formatStr?: any, ...args: any[]): void => (undefined)
		});
		testInjector.register("httpClient", {});
		testInjector.register("projectDataService", {});
		return testInjector;
	};

	let isHttpRequestCalled = false;
	afterEach(() => {
		process.env.TNS_CLI_CLOUD_VERSION = TNS_CLI_CLOUD_VERSION_ORIGINAL;
	});

	beforeEach(() => {
		isHttpRequestCalled = false;
		process.env.TNS_CLI_CLOUD_VERSION = "";
	});

	describe("getCliVersion", () => {
		const cliVersion = "5.0.0";
		it("returns process.env.TNS_CLI_CLOUD_VERSION when it is set", async () => {
			const testInjector = createTestInjector();
			process.env.TNS_CLI_CLOUD_VERSION = cliVersion;

			const versionService = testInjector.resolve<IVersionService>(VersionService);
			const actualCliVersion = await versionService.getCliVersion(null);
			assert.equal(actualCliVersion, cliVersion);
		});

		const testData: any[] = [
			{
				runtimeVersion: "5.0.0",
				expectedCliVersion: "5.0.2"
			},
			{
				runtimeVersion: "5.0.2",
				expectedCliVersion: "5.0.2"
			},
			{
				runtimeVersion: "5.0.5",
				expectedCliVersion: "5.0.2"
			},
			{
				runtimeVersion: "5.1.5",
				expectedCliVersion: "5.1.0"
			}
		];

		const mockHttpRequest = (testInjector: IInjector, body: IDictionary<any>, error?: Error) => {
			const httpClient = testInjector.resolve<Server.IHttpClient>("httpClient");

			httpClient.httpRequest = async (url: string): Promise<any> => {
				isHttpRequestCalled = true;
				assert.equal(url, "http://registry.npmjs.org/nativescript");
				if (error) {
					throw error;
				}

				return { body: JSON.stringify(body) };

			};
		};

		_.each(testData, ({ runtimeVersion, expectedCliVersion }) => {
			it(`returns correct CLI version, based on runtime version, input: ${runtimeVersion}, expectedOutput: ${expectedCliVersion}`, async () => {
				const testInjector = createTestInjector();
				const body = {
					versions: {
						"1.0.0": {},
						"5.0.0": {},
						"5.0.1": {},
						"5.0.2": {},
						"5.1.0": {},
						"6.0.0": {},
					}
				};

				mockHttpRequest(testInjector, body);
				const versionService = testInjector.resolve<IVersionService>(VersionService);
				const actualCliVersion = await versionService.getCliVersion(runtimeVersion);
				assert.equal(actualCliVersion, expectedCliVersion);
				assert.isTrue(isHttpRequestCalled, "An http request to registry.npmjs.org should have been made in order to get data for CLI.");
			});
		});

		it("fails when unable to determine CLI version as runtime version is not valid semver version", async () => {
			const testInjector = createTestInjector();
			const body = {
				versions: {
					"5.0.0": {}
				}
			};

			mockHttpRequest(testInjector, body);

			const versionService = testInjector.resolve<IVersionService>(VersionService);
			const invalidRuntimeVersion = "some invalid version";
			await assert.isRejected(versionService.getCliVersion(invalidRuntimeVersion), `Unable to determine CLI version for cloud build based on project's runtime version: ${invalidRuntimeVersion}. Error is: Invalid Version: ${invalidRuntimeVersion}`);
			assert.isFalse(isHttpRequestCalled, "An http request to registry.npmjs.org should have NOT been made.");
		});

		it("fails when http request to get CLI versions fails", async () => {
			const testInjector = createTestInjector();
			const err = new Error("Http request fails.");
			mockHttpRequest(testInjector, null, err);

			const versionService = testInjector.resolve<IVersionService>(VersionService);
			const runtimeVersion = "1.2.3";
			await assert.isRejected(versionService.getCliVersion(runtimeVersion), `Unable to determine CLI version for cloud build based on project's runtime version: ${runtimeVersion}. Error is: Cannot find CLI versions.`);

			assert.isTrue(isHttpRequestCalled, "An http request to registry.npmjs.org should have been made in order to get data for CLI.");
		});
	});

	describe("getProjectRuntimeVersion", () => {
		let isGetNSValueCalled = false;

		beforeEach(() => {
			isGetNSValueCalled = false;
		});

		const mockGetNSValue = (testInjector: IInjector, runtimeVersion: string, projectDir: string, platform: string): void => {
			const projectDataService = testInjector.resolve<IProjectDataService>("projectDataService");

			projectDataService.getNSValue = (projDir: string, propertyName: string): any => {
				isGetNSValueCalled = true;
				assert.equal(projDir, projectDir, "getNSValue should be called with the projectDir passed to getProjectRuntimeVersion");
				assert.equal(propertyName, `tns-${platform}.version`);

				return runtimeVersion;
			};
		};
		it("returns the version from package.json", async () => {
			const testInjector = createTestInjector();
			const projectDir = "project dir";
			const platform = "platform";
			const runtimeVersion = "3.0.0";

			mockGetNSValue(testInjector, runtimeVersion, projectDir, platform);

			const versionService = testInjector.resolve<IVersionService>(VersionService);
			const actualRuntimeVersion = await versionService.getProjectRuntimeVersion(projectDir, platform);
			assert.equal(actualRuntimeVersion, runtimeVersion);
			assert.isTrue(isGetNSValueCalled, "getNSValue must be called");
		});

		it("fails when runtime is not added to package.json", async () => {
			const testInjector = createTestInjector();
			const projectDir = "project dir";
			const platform = "platform";

			mockGetNSValue(testInjector, null, projectDir, platform);

			const versionService = testInjector.resolve<IVersionService>(VersionService);
			await assert.isRejected(versionService.getProjectRuntimeVersion(projectDir, platform), `Unable to find runtime version for package tns-${platform}.`);
			assert.isTrue(isGetNSValueCalled, "getNSValue must be called");
		});
	});
});
