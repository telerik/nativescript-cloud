import { EulaService } from "../../lib/services/eula-service";
import { Yok } from "mobile-cli-lib/yok";
import { assert } from "chai";
import { EulaConstants } from "../../lib/constants";

interface IEulaTestData {
	testName: string;
	acceptedEulaHash?: string;
	eulaFileShasum?: string;
	expectedResult?: IEulaData;
	httpRequestShouldFail?: boolean;
	isLocalEulaFileMissing?: boolean;
	eulaLastModifiedTimeInEpoch?: number;
	currentTimeInEpoch?: number;
}

interface IEulaTestDataWithCache extends IEulaTestData {
	expectedToDownloadEula?: boolean;
}

interface IAcceptEulaTestData extends IEulaTestData {
	expectedHash?: string;
}

const unableToDownloadEulaErrorMessage = "Unable to download EULA.";
describe("eulaService", () => {
	const createTestInjector = (testInfo: IEulaTestData): IInjector => {
		const testInjector = new Yok();
		testInjector.register("httpClient", {
			httpRequest: async (options: any, proxySettings?: IProxySettings): Promise<Server.IResponse> => {
				if (testInfo.httpRequestShouldFail) {
					throw new Error(unableToDownloadEulaErrorMessage);
				}

				return null;
			}
		});

		testInjector.register("userSettingsService", {
			getSettingValue: async (settingName: string): Promise<any> => testInfo.acceptedEulaHash,
			saveSetting: async (key: string, value: any): Promise<void> => undefined
		});

		testInjector.register("logger", {
			trace: (formatStr?: any, ...args: any[]): void => undefined,
			info: (formatStr?: any, ...args: any[]): void => undefined,
		});

		testInjector.register("fs", {
			exists: (path: string): boolean => !testInfo.isLocalEulaFileMissing,
			createWriteStream: (path: string, options?: { flags?: string; encoding?: string; string?: string; }): any => ({}),
			getFileShasum: async (fileName: string, options?: { algorithm?: string, encoding?: string }): Promise<string> => testInfo.eulaFileShasum,
			getFsStats: (path: string): IFsStats => (<any>{
				mtime: { getTime: (): number => testInfo.eulaLastModifiedTimeInEpoch || 0 }
			})
		});

		testInjector.register("options", {
			profileDir: ""
		});

		testInjector.register("nsCloudDateTimeService", {
			getCurrentEpochTime: () => testInfo.currentTimeInEpoch || 0
		});

		testInjector.register("lockfile", {
			lock: async (lockFilePath?: string, lockFileOpts?: ILockFileOptions): Promise<void> => undefined,
			unlock: (lockFilePath?: string): void => undefined
		});

		return testInjector;
	};

	const testData: IEulaTestData[] = [
		{
			testName: "returns EULA should be accepted when it has never been accepted",
			expectedResult: { shouldAcceptEula: true, url: EulaConstants.eulaUrl }
		},
		{
			testName: "returns EULA should be accepted when it has been accepted, but new EULA is downloaded",
			expectedResult: { shouldAcceptEula: true, url: EulaConstants.eulaUrl },
			acceptedEulaHash: "old hash",
			eulaFileShasum: "new hash",
		},
		{
			testName: "returns EULA should NOT be accepted when it has been accepted, and new EULA is the same as the accepted one",
			expectedResult: { shouldAcceptEula: false, url: EulaConstants.eulaUrl },
			acceptedEulaHash: "hash",
			eulaFileShasum: "hash"
		},
		{
			testName: "returns EULA should NOT be accepted when it has been accepted, and new EULA cannot be downloaded",
			expectedResult: { shouldAcceptEula: false, url: EulaConstants.eulaUrl },
			acceptedEulaHash: "hash",
			httpRequestShouldFail: true,
			isLocalEulaFileMissing: true
		}
	];

	["getEulaData", "getEulaDataWithCache"].forEach(methodName => {
		describe(methodName, () => {
			testData.forEach(testCase => {
				it(testCase.testName, async () => {
					const testInjector = createTestInjector(testCase);
					const nsCloudEulaService = testInjector.resolve<IEulaService>(EulaService);
					const eulaData = await (<any>nsCloudEulaService)[methodName]();
					assert.deepEqual(eulaData, testCase.expectedResult);
				});
			});
		});
	});

	describe("getEulaDataWithCache", () => {
		const testDataWithCache: IEulaTestDataWithCache[] = [
			{
				testName: "should download EULA when it has not been downloaded for more than 24 hours",
				currentTimeInEpoch: 24 * 60 * 60 * 1000 + 1,
				eulaLastModifiedTimeInEpoch: 0,
				expectedToDownloadEula: true
			},
			{
				testName: "should NOT download EULA when it has not been downloaded for exactly 24 hours",
				currentTimeInEpoch: 24 * 60 * 60 * 1000,
				eulaLastModifiedTimeInEpoch: 0,
				expectedToDownloadEula: false
			},
			{
				testName: "should NOT download EULA when it has not been downloaded for less than 24 hours",
				currentTimeInEpoch: 24 * 60 * 60 * 1000 - 1,
				eulaLastModifiedTimeInEpoch: 0,
				expectedToDownloadEula: false
			}
		];

		testDataWithCache.forEach(cacheCaseData => {
			const testCase: IEulaTestDataWithCache = _.merge({
				expectedResult: { shouldAcceptEula: true, url: EulaConstants.eulaUrl },
				acceptedEulaHash: "old hash",
				eulaFileShasum: "new hash"
			}, cacheCaseData);

			it(testCase.testName, async () => {
				const testInjector = createTestInjector(testCase);
				const $logger = testInjector.resolve<ILogger>("logger");
				const loggedMessage: string[] = [];
				$logger.trace = (formatStr?: any, ...args: any[]): void => {
					loggedMessage.push(formatStr);
				};

				const nsCloudEulaService = testInjector.resolve<IEulaService>(EulaService);
				const eulaData = await nsCloudEulaService.getEulaDataWithCache();
				assert.deepEqual(eulaData, testCase.expectedResult);

				const msg = "Will download new EULA as either local EULA does not exist or the cache time has passed.";
				if (testCase.expectedToDownloadEula) {
					assert.include(loggedMessage, msg);
				} else {
					assert.notInclude(loggedMessage, msg);
				}
			});

		});

	});

	describe("acceptEula", () => {
		// should fail in case unable to download eula
		// should save to user settings hash of the accepted eula
		const testInfo: IAcceptEulaTestData[] = [
			{
				httpRequestShouldFail: true,
				testName: "should throw error in case unable to download EULA"
			},
			{
				eulaFileShasum: "some shasum",
				testName: "should save in user settings the hash of the downloaded EULA"
			}
		];

		testInfo.forEach(testCase => {
			it(testCase.testName, async () => {
				const testInjector = createTestInjector(testCase);
				const $userSettingsService = testInjector.resolve<IUserSettingsService>("userSettingsService");
				let savedSettings: IStringDictionary = {};
				$userSettingsService.saveSetting = async (key: string, value: any): Promise<void> => {
					savedSettings[key] = value;
				};

				const nsCloudEulaService = testInjector.resolve<IEulaService>(EulaService);

				if (testCase.httpRequestShouldFail) {
					await assert.isRejected(nsCloudEulaService.acceptEula(), unableToDownloadEulaErrorMessage);
				} else {
					await nsCloudEulaService.acceptEula();
					assert.deepEqual(savedSettings, { [EulaConstants.acceptedEulaHashKey]: testCase.eulaFileShasum });
				}
			});
		});
	});
});
