import { assert } from "chai";

import { Yok } from "nativescript/lib/common/yok";
import { CloudOperationFactory } from "../../lib/cloud-operation/cloud-operation-factory";
import * as CloudOperationV1 from "../../lib/cloud-operation/cloud-operation-v1";
import * as CloudOperationV2 from "../../lib/cloud-operation/cloud-operation-v2";

describe("nsCloudOperationFactory", () => {
	let factory: ICloudOperationFactory;
	const createTestInjector = (): IInjector => {
		const testInjector = new Yok();

		testInjector.register("logger", {
			trace: (formatStr?: any, ...args: any[]): void => undefined,
		});
		testInjector.register("nsCloudCommunicationChannelFactory", {
			create: (): any => null
		});
		testInjector.register("nsCloudOutputFilter", {});
		testInjector.register("nsCloudS3Service", {});
		testInjector.register("nsCloudOperationFactory", CloudOperationFactory);
		testInjector.register("injector", testInjector);

		return testInjector;
	};
	beforeEach(() => {
		const injector = createTestInjector();
		factory = injector.resolve("nsCloudOperationFactory");
	});

	describe("create", () => {
		it("should create cloud operation version 1 if v1 is provided.", () => {
			const cloudOperation = factory.create("v1", "test", null);
			assert.instanceOf(cloudOperation, <any>CloudOperationV1);
		});
		it("should create cloud operation version 2 if v2 is provided.", () => {
			const cloudOperation = factory.create("v2", "test", <any>{});
			assert.instanceOf(cloudOperation, <any>CloudOperationV2);
		});
		it("should throw error if unknown communication channel is provided.", () => {
			const invalidCloudOperationVersion = "invalid";
			assert.throws(() => {
				factory.create(invalidCloudOperationVersion, "test", null);
			}, `Invalid cloud operation version: ${invalidCloudOperationVersion}`);
		});
	});
});
