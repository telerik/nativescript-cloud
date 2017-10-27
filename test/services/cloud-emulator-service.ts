import { CloudEmulatorService } from "../../lib/services/cloud-services/cloud-emulator-service";
import { HTTP_METHODS } from "../../lib/constants";
import { Yok } from "mobile-cli-lib/yok";
import { assert } from "chai";

describe("cloud emulator service", () => {
	describe("deployApp", async () => {
		const emulatorCredentials = { publicKey: "publicKey", privateKey: "privateKey", platform: "platform" };
		const filePath = "localPath";
		const platform = "platform";

		function createTestInjector(): IInjector {
			const testInjector = new Yok();
			testInjector.register("nsCloudRequestService", {
				call: async () => emulatorCredentials
			});
			testInjector.register("fs", {
				exists: () => true,
				readJson: () => ({}),
				writeJson: () => { /* empty */ }
			});
			testInjector.register("nsCloudUploadService", {
				uploadToS3: async (url: string) => url
			});
			testInjector.register("nsCloudDeviceEmulator", { /* empty */ });
			testInjector.register("options", {
				profileDir: "test"
			});
			testInjector.register("nsCloudEulaService", {
				getEulaDataWithCache: () => Promise.resolve({})
			});

			return testInjector;
		}

		it("should upload to S3 in case a local file is passed", async () => {
			const injector = createTestInjector();
			let hasUploadedToS3 = false;
			injector.resolve("nsCloudUploadService").uploadToS3 = (url: string) => {
				if (url === filePath) {
					hasUploadedToS3 = true;
				}
			};

			const nsCloudEmulatorService: ICloudEmulatorService = injector.resolve(CloudEmulatorService);
			await nsCloudEmulatorService.deployApp(filePath, platform);

			assert.isTrue(hasUploadedToS3);
		});

		it("should call create if emulator credentials not present", async () => {
			const injector = createTestInjector();
			let hasCalledCloudRequestService = false;
			injector.resolve("nsCloudRequestService").call = (options: ICloudRequestOptions) => {
				hasCalledCloudRequestService = true;
				assert.deepEqual(options.method, HTTP_METHODS.POST, "create is not called upon missing credentials");

				return emulatorCredentials;
			};

			const nsCloudEmulatorService: ICloudEmulatorService = injector.resolve(CloudEmulatorService);
			await nsCloudEmulatorService.deployApp(filePath, platform);

			assert.isTrue(hasCalledCloudRequestService);
		});

		it("should call update if emulator credentials present", async () => {
			const injector = createTestInjector();
			let hasCalledCloudRequestService = false;
			injector.resolve("fs").readJson = () => ({
				[platform]: emulatorCredentials
			});
			injector.resolve("nsCloudRequestService").call = (options: ICloudRequestOptions) => {
				hasCalledCloudRequestService = true;
				assert.deepEqual(options.method, HTTP_METHODS.PUT, "update is not called upon existing credentials");

				return emulatorCredentials;
			};

			const nsCloudEmulatorService: ICloudEmulatorService = injector.resolve(CloudEmulatorService);
			await nsCloudEmulatorService.deployApp(filePath, platform);

			assert.isTrue(hasCalledCloudRequestService);
		});
	});
});
