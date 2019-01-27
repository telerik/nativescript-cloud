import { assert } from "chai";

import { Yok } from "nativescript/lib/common/yok";
import { CloudOperationFactory } from "../../lib/cloud-operation/cloud-operation-factory";
import { CommunicationChannelMock } from "./mocks/communication-channel-mock";

describe("Cloud operation v2", () => {
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

	const createCloudOperation = (communicationChannel?: ICloudCommunicationChannel): ICloudOperation => {
		const testInjector = createTestInjector(communicationChannel || new CommunicationChannelMock());
		const factory = testInjector.resolve("nsCloudOperationFactory");
		const cloudOperation: ICloudOperation = factory.create("v2", "test", <any>{});
		return cloudOperation;
	};

	describe("init", () => {
		it("should connect to the communication channel.", async () => {
			let communicationChannelConnectCalled = false;
			const attachedHandlers: IDictionary<Function> = {};
			const onEvent = (evt: string, handler: Function) => {
				attachedHandlers[evt] = handler;
			};

			const communicationChannel = new CommunicationChannelMock();
			communicationChannel.connect = async () => { communicationChannelConnectCalled = true };
			communicationChannel.once = <any>onEvent;
			const cloudOperation = createCloudOperation(communicationChannel);

			await cloudOperation.init();
			assert.isTrue(communicationChannelConnectCalled);
			assert.isFunction(attachedHandlers["close"]);
		});
		it("should fail if the wait to start timeout expires.", async () => {
			const communicationChannel = new CommunicationChannelMock();
			communicationChannel.connect = () => new Promise(() => { /* never resolve this promise */ });
			const cloudOperation = createCloudOperation(communicationChannel);
			(<any>cloudOperation.constructor).WAIT_TO_START_TIMEOUT = 1;

			try {
				await cloudOperation.init();
			} catch (err) {
				assert.deepEqual(err.message, "Communication channel init timed out.");
				return;
			}

			assert.fail();
		});
		it("should cleanup when the communication channel is closed after the init.", async () => {
			const communicationChannel = new CommunicationChannelMock();
			const cloudOperation = createCloudOperation(communicationChannel);
			let cloudOperationCleanupCalledCount = 0;
			cloudOperation.cleanup = async () => {
				cloudOperationCleanupCalledCount++;
			};

			await cloudOperation.init();
			cloudOperation.waitForResult().catch(err => { /* no need to do anything */ });
			await communicationChannel.emit("close", 15);

			// After successful init, the cloud operation should remove the cloud close listener attached in the init.
			// The cleanup method should be called from the close listener in the wait for result promise.
			assert.deepEqual(cloudOperationCleanupCalledCount, 1);
		});
		it("should cleanup when the communication channel is closed during the init.", async () => {
			const communicationChannel = new CommunicationChannelMock();
			communicationChannel.connect = () => new Promise(() => { /* never resolve this promise */ });
			const cloudOperation = createCloudOperation(communicationChannel);
			let cloudOperationCleanupCalledCount = 0;
			cloudOperation.cleanup = async () => {
				cloudOperationCleanupCalledCount++;
			};

			cloudOperation.init().catch(err => { /* no need to do anything */ });
			await communicationChannel.emit("close", 15);
			assert.deepEqual(cloudOperationCleanupCalledCount, 1);
		});
		it("should cleanup when the communication channel is closed during the init.", async () => {
			const failedToConnectMessage = "failed to connect";
			const communicationChannel = new CommunicationChannelMock();
			communicationChannel.connect = () => Promise.reject(new Error(failedToConnectMessage));
			const cloudOperation = createCloudOperation(communicationChannel);
			let cloudOperationCleanupCalledCount = 0;
			cloudOperation.cleanup = async () => {
				cloudOperationCleanupCalledCount++;
			};

			try {
				await cloudOperation.init();
			} catch (err) {
				assert.deepEqual(cloudOperationCleanupCalledCount, 1);
				assert.deepEqual(err.message, failedToConnectMessage);
			}
		});
	});

	describe("sendMessage", () => {
		it("should send the message to the communication channel.", async () => {
			let receivedMessage: ICloudOperationMessage<any>;
			const communicationChannel = new CommunicationChannelMock();
			communicationChannel.sendMessage = async (msg: any) => receivedMessage = msg;
			const cloudOperation = createCloudOperation(communicationChannel);

			const msg: ICloudOperationMessage<any> = {
				cloudOperationId: "test",
				type: "clientHello",
				body: {
					someProp: "someValue"
				}
			};

			await cloudOperation.init();
			await cloudOperation.sendMessage(msg);

			assert.deepEqual(receivedMessage, msg);
		});
		it("should fail if the cloud operation is not initialized.", async () => {
			const cloudOperation = createCloudOperation();

			try {
				await cloudOperation.sendMessage(null);
			} catch (err) {
				assert.deepEqual(err.message, "Not initialized");
				return;
			}

			assert.fail();
		});
	});
});
