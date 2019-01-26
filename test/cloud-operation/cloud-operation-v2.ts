import { assert } from "chai";

import { Yok } from "nativescript/lib/common/yok";
import { CloudOperationFactory } from "../../lib/cloud-operation/cloud-operation-factory";
import { CommunicationChannelMock } from "./mocks/communication-channel-mock";

describe.only("Clou operation v2", () => {
	const createTestInjector = (communicationChannel: ICloudCommunicationChannel): IInjector => {
		const testInjector = new Yok();

		testInjector.register("logger", {
			trace: (formatStr?: any, ...args: any[]): void => undefined,
		});
		testInjector.register("nsCloudCommunicationChannelFactory", {
			create: (): any => communicationChannel
		});
		testInjector.register("nsCloudOutputFilter", {});
		testInjector.register("nsCloudS3Service", {});
		testInjector.register("nsCloudOperationFactory", CloudOperationFactory);
		testInjector.register("injector", testInjector);

		return testInjector;
	};

	describe("init", () => {
		it("should connect to the communication channel.", async () => {
			let communicationChannelConnectCalled = false;
			const attachedHandlers: IDictionary<Function> = {};
			const onEvent = (evt: string, handler: Function) => {
				attachedHandlers[evt] = handler;
			};
			const emptyPromiseFunc = async (): Promise<any> => null;
			const communicationChannel: ICloudCommunicationChannel = new CommunicationChannelMock(
				async () => { communicationChannelConnectCalled = true },
				emptyPromiseFunc,
				emptyPromiseFunc,
				onEvent,
				onEvent
			);

			const testInjector = createTestInjector(communicationChannel);
			const factory = testInjector.resolve("nsCloudOperationFactory");
			const cloudOperation: ICloudOperation = factory.create("v2", "test", <any>{});

			await cloudOperation.init();
			assert.isTrue(communicationChannelConnectCalled);
			assert.isFunction(attachedHandlers["close"]);
		});
	});
});
