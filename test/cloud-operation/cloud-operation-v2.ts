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
			communicationChannel.connect = async () => { communicationChannelConnectCalled = true; };
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

			await assert.isRejected(cloudOperation.init(), "Communication channel init timed out.");
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

			await assert.isRejected(cloudOperation.init(), failedToConnectMessage);
			assert.deepEqual(cloudOperationCleanupCalledCount, 1);
		});
		it("should subscribe for messages from the communication channel.", async () => {
			const communicationChannel = new CommunicationChannelMock();
			const cloudOperation = createCloudOperation(communicationChannel);
			const expected = {
				type: "serverHello",
				body: {
					test: "value"
				}
			};

			let actual: any;

			await cloudOperation.init();
			const promise = new Promise((resolve) => {
				cloudOperation.on("message", msg => {
					actual = msg;
					resolve();
				});
			});
			communicationChannel.emit("message", expected);
			await promise;

			assert.deepEqual(actual, expected);
		});
	});

	describe("sendMessage", () => {
		it("should send the message to the communication channel.", async () => {
			let receivedMessage: ICloudOperationMessage<any>;
			const communicationChannel = new CommunicationChannelMock();
			communicationChannel.sendMessage = async (m: any) => receivedMessage = m;
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
			await assert.isRejected(cloudOperation.sendMessage(null), "Not initialized");
		});
	});

	describe("waitForResult", () => {
		it("should fail if the cloud operation is not initialized.", async () => {
			const cloudOperation = createCloudOperation();
			await assert.isRejected(cloudOperation.waitForResult(), "Not initialized");
		});

		const successTestCases = [
			{
				description: "should return correct result if the cloud operation has code 0.",
				expectedResult: {
					code: 0,
					stdout: "test"
				}
			},
			{
				description: "should return correct result if the cloud operation return data.",
				expectedResult: {
					stdout: "test",
					data: {
						test: "value"
					}
				}
			}
		];

		successTestCases.forEach(c => {
			it(c.description, async () => {
				const communicationChannel = new CommunicationChannelMock();
				const cloudOperation = createCloudOperation(communicationChannel);

				await cloudOperation.init();
				communicationChannel.emit("message", { type: "result", body: c.expectedResult });
				const result = await cloudOperation.waitForResult();

				assert.deepEqual(result, <any>c.expectedResult);
			});
		});

		const failTestCases = [
			{
				description: "should throw error if the cloud operation has exit code different than 0.",
				expectedResult: {
					code: 127,
					stdout: "test"
				}
			},
			{
				description: "should throw error if the cloud operation has no exit code and no data.",
				expectedResult: {
					stdout: "test"
				}
			}
		];

		failTestCases.forEach(c => {
			it(c.description, async () => {
				const communicationChannel = new CommunicationChannelMock();
				const cloudOperation = createCloudOperation(communicationChannel);

				await cloudOperation.init();
				communicationChannel.emit("message", { type: "result", body: c.expectedResult });
				await assert.isRejected(cloudOperation.waitForResult(), c.expectedResult);
			});
		});

		it("should fail if the communication channel closes before any result is sent.", async () => {
			const communicationChannel = new CommunicationChannelMock();
			const cloudOperation = createCloudOperation(communicationChannel);
			const exitCode = 15;

			await cloudOperation.init();
			communicationChannel.emit("close", exitCode);
			await assert.isRejected(cloudOperation.waitForResult(), `Communication channel closed with code ${exitCode}`);
		});
	});

	describe("getResult", () => {
		it("should return the result if the cloud operation is finished.", async () => {
			const communicationChannel = new CommunicationChannelMock();
			const cloudOperation = createCloudOperation(communicationChannel);
			const expected = {
				code: 0,
				stdout: "test"
			};

			await cloudOperation.init();
			communicationChannel.emit("message", { type: "result", body: expected });
			await cloudOperation.waitForResult();

			assert.deepEqual(cloudOperation.getResult(), <any>expected);
		});
		it("should fail if the cloud operation is not initialized.", () => {
			const cloudOperation = createCloudOperation();
			assert.throws(() => cloudOperation.getResult(), "Not initialized");
		});
	});
});
