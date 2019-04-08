import { EulaService } from "../../lib/services/eula-service";
import { HashService } from "../../lib/services/hash-service";
import { Yok } from "nativescript/lib/common/yok";
import { assert } from "chai";
import { EulaConstants } from "../../lib/constants";
import { NsCouldLockService } from "../../lib/services/lock-service";

interface IEulaTestData {
	testName: string;
	acceptedEulaHash?: string;
	eulaFileShasum?: string;
	expectedResult?: IEulaData;
	httpRequestShouldFail?: boolean;
	isLocalEulaFileMissing?: boolean;
	eulaLastModifiedTimeInEpoch?: number;
	currentTimeInEpoch?: number;

	expectedHttpRequestIfModifiedSinceHeader?: string;
	actualHttpRequestIfModifiedSinceHeader?: string;
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

				testInfo.actualHttpRequestIfModifiedSinceHeader = options && options.headers && options.headers["If-Modified-Since"];

				return <any>{
					response: {
						statusCode: testInfo.actualHttpRequestIfModifiedSinceHeader ? 304 : 200
					}
				};
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
				mtime: {
					getTime: (): number => testInfo.eulaLastModifiedTimeInEpoch || 0,
					toUTCString: (): string => new Date(testInfo.eulaLastModifiedTimeInEpoch || 0).toUTCString()
				},
			}),
			copyFile: (sourceFileName: string, destinationFileName: string): void => undefined
		});

		testInjector.register("settingsService", {
			getProfileDir: () => ""
		});

		testInjector.register("lockfile", {
			lock: async (lockFilePath?: string, lockFileOpts?: ILockOptions): Promise<void> => undefined,
			unlock: (lockFilePath?: string): void => undefined
		});

		testInjector.register("nsCloudLockService", NsCouldLockService);

		testInjector.register("nsCloudHashService", HashService);

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

	const testRequestsData: IEulaTestData[] = [
		{
			testName: "should NOT send If-Modified-Since header when local EULA is missing",
			isLocalEulaFileMissing: true,
			expectedHttpRequestIfModifiedSinceHeader: undefined
		},
		{
			testName: "should send If-Modified-Since header with the local EULA mtime",
			expectedHttpRequestIfModifiedSinceHeader: new Date(2018, 5).toUTCString(),
			eulaLastModifiedTimeInEpoch: new Date(2018, 5).getTime(),
		}
	];

	["getEulaData", "getEulaDataWithCache"].forEach(methodName => {
		describe(methodName, () => {
			testRequestsData.forEach(testCase => {
				it(testCase.testName, async () => {
					const testInjector = createTestInjector(testCase);
					const nsCloudEulaService = testInjector.resolve<IEulaService>(EulaService);
					await (<any>nsCloudEulaService)[methodName]();

					assert.equal(testCase.actualHttpRequestIfModifiedSinceHeader, testCase.expectedHttpRequestIfModifiedSinceHeader);
				});
			});
		});
	});

	describe("acceptEula", () => {
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
