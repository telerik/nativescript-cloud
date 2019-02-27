import { assert } from "chai";

import { Yok } from "nativescript/lib/common/yok";
import { CommunicationChannelFactory } from "../../../lib/cloud-operation/communication/communication-channel-factory";
import { CommunicationChannelBase } from "../../../lib/cloud-operation/communication/communication-channel-base";
import { WebSocketMock } from "../mocks/websocket-mock";
import { CloudOperationMessageTypes, CloudCommunicationEvents } from "../../../lib/constants";

describe("WebSocket communication channel", () => {
	const createTestInjector = (ws: IWebSocket): IInjector => {
		const testInjector = new Yok();

		testInjector.register("logger", {
			trace: (formatStr?: any, ...args: any[]): void => undefined,
		});
		testInjector.register("nsCloudCommunicationChannelFactory", CommunicationChannelFactory);
		testInjector.register("nsCloudWebSocketFactory", {
			create: (): IWebSocket => ws
		});
		testInjector.register("injector", testInjector);

		return testInjector;
	};

	const createWebSocketCommunicationChannel = (): { channel: ICloudCommunicationChannel, ws: WebSocketMock } => {
		const ws = new WebSocketMock();
		const testInjector = createTestInjector(ws);
		let factory: ICloudCommunicationChannelFactory = testInjector.resolve("nsCloudCommunicationChannelFactory");
		return {
			channel: factory.create<any>({ type: "WebSocket", config: { data: "cloud-operation.nativescript.cloud" } }, "test"),
			ws
		};
	};

	let originalPingInterval: number;
	beforeEach(() => {
		originalPingInterval = (<any>CommunicationChannelBase).PING_INTERVAL;
	});

	afterEach(() => {
		(<any>CommunicationChannelBase).PING_INTERVAL = originalPingInterval;
	});

	describe("connect", () => {
		it("should establish handshake.", async () => {
			const { channel, ws } = createWebSocketCommunicationChannel();
			ws.sendCore = (msg: ICloudOperationWebSocketMessage<any>): Error => {
				assert.deepEqual(msg.action, "sendMessage");
				return null;
			};

			const promise = channel.connect();

			ws.emit("open");
			await promise;
		});
		it("should not try to connect if already connected.", async () => {
			const { channel, ws } = createWebSocketCommunicationChannel();
			let clientHellosCount = 0;
			ws.sendCore = (msg: ICloudOperationWebSocketMessage<any>): Error => {
				if (msg.body.type === CloudOperationMessageTypes.CLOUD_OPERATION_CLIENT_HELLO) {
					clientHellosCount++;
				}

				return null;
			};

			const promise = channel.connect();
			ws.emit("open");

			await promise;
			assert.deepEqual(clientHellosCount, 1);

			await channel.connect();
			assert.deepEqual(clientHellosCount, 1);
		});
		it("should start ping after the handshake is complete.", async () => {
			(<any>CommunicationChannelBase).PING_INTERVAL = 10;
			const { channel, ws } = createWebSocketCommunicationChannel();
			let echoSent = false;
			const pingPromise = new Promise((resolve) => {
				ws.sendCore = (msg: ICloudOperationWebSocketMessage<ICloudOperationEcho>): Error => {
					if (msg.body.type === CloudOperationMessageTypes.CLOUD_OPERATION_ECHO) {
						echoSent = true;
						resolve();
					}

					return null;
				};
			});

			const promise = channel.connect();

			ws.emit("open");
			await promise;
			await pingPromise;
			assert.isTrue(echoSent);
		});

		const expectedWebsocketCloseCode = 15;
		const websocketErrorOnConnectTestCases = [
			{
				description: "should reject if the websocket closes during the handshake.",
				errorEvent: "close",
				expectedErrorMessage: `Connection closed with code: ${expectedWebsocketCloseCode}`,
				emitArgs: [expectedWebsocketCloseCode]
			},
			{
				description: "should reject if the websocket emits unexpected response during the handshake.",
				errorEvent: "unexpected-response",
				expectedErrorMessage: "Unexpected response received.",
				emitArgs: []
			}
		];

		websocketErrorOnConnectTestCases.forEach(c => {
			it(c.description, async () => {
				const { channel, ws } = createWebSocketCommunicationChannel();
				ws.send = <any>(((msg: string, cb: Function): any => cb(null)));

				const promise = channel.connect();
				ws.emit.apply(ws, [c.errorEvent].concat(<any>c.emitArgs));
				ws.emit(c.errorEvent);

				await assert.isRejected(promise, c.expectedErrorMessage);
			});
		});

		it("should reject if the creation of the websocket fails.", async () => {
			const { channel, ws } = createWebSocketCommunicationChannel();
			ws.send = <any>(((msg: string, cb: Function): any => cb(null)));
			const expectedErrorMessage = "Failed to create WebSocket";
			(<any>channel).$nsCloudWebSocketFactory.create = () => { throw new Error(expectedErrorMessage); };

			await assert.isRejected(channel.connect(), expectedErrorMessage);
		});
	});

	describe("ping", () => {
		const expectedEchoesMissing = 6;
		const pingInterval = 1;
		const missingPingsCloseCode = 129;
		beforeEach(() => {
			(<any>CommunicationChannelBase).PING_INTERVAL = pingInterval;
		});

		it("should close the channel if enough echo replies are missing.", async () => {
			const { channel, ws } = createWebSocketCommunicationChannel();
			let echosSent = 0;
			ws.sendCore = (msg: ICloudOperationWebSocketMessage<ICloudOperationEcho>): Error => {
				if (msg.body.type === CloudOperationMessageTypes.CLOUD_OPERATION_ECHO) {
					echosSent++;
				}

				return null;
			};

			const promise = channel.connect();

			ws.emit("open");
			await promise;

			let actualCode: number;
			let actualReason: string;
			await new Promise((resolve) => {
				channel.once("close", (code: number, reason?: string) => {
					actualCode = code;
					actualReason = reason;
					resolve();
				});
			});

			assert.deepEqual(echosSent, expectedEchoesMissing);
			assert.deepEqual(actualCode, missingPingsCloseCode);
			assert.deepEqual(actualReason, "Communication channel did not receive echo replies.");
		});
		it("should not close the channel if some of the echo messages are missing.", async () => {
			const { channel, ws } = createWebSocketCommunicationChannel();
			let echosSent = 0;
			ws.sendCore = (msg: ICloudOperationWebSocketMessage<ICloudOperationEcho>): Error => {
				if (msg.body.type === CloudOperationMessageTypes.CLOUD_OPERATION_ECHO) {
					if (echosSent++ % (expectedEchoesMissing - 1) === 0) {
						const reply = { type: CloudOperationMessageTypes.CLOUD_OPERATION_ECHO_REPLY, body: msg.body.body };
						ws.emit(CloudCommunicationEvents.MESSAGE, reply);
					}
				}

				return null;
			};

			const promise = channel.connect();
			let actualCode: number;
			channel.once(CloudCommunicationEvents.CLOSE, (code: number) => {
				actualCode = code;
			});

			ws.emit("open");
			await promise;

			await new Promise((resolve) => {
				const testRuntime = pingInterval * expectedEchoesMissing * 100;
				setTimeout(() => {
					resolve();
				}, testRuntime);
			});

			assert.isAbove(echosSent, expectedEchoesMissing);
			assert.notDeepEqual(actualCode, missingPingsCloseCode);
		});
	});

	describe("sendMessage", () => {
		it("should send the message to the websocket if the communication channel is connected.", async () => {
			const { channel, ws } = createWebSocketCommunicationChannel();
			const promise = channel.connect();

			ws.emit("open");
			await promise;

			const message: ICloudOperationMessage<any> = {
				type: "test",
				cloudOperationId: "test",
				body: {
					test: "value"
				}
			};

			let actualMessage: ICloudOperationWebSocketMessage<any>;
			const sendMessagePromise = new Promise((resolve) => {
				ws.sendCore = (msg: ICloudOperationWebSocketMessage<any>): Error => {
					actualMessage = msg;
					resolve();
					return null;
				};
			});

			await channel.sendMessage(message);
			await sendMessagePromise;

			assert.deepEqual(actualMessage.body, message);
			assert.deepEqual(actualMessage.cloudOperationId, message.cloudOperationId);
		});

		const expectedSendMessageErrorMessage = "Failed to send message";
		const sendMessageRejectTestCases = [
			{
				description: "should reject if the websocket returns error in the send message callback.",
				sendCore: (msg: ICloudOperationWebSocketMessage<any>): Error => {
					return new Error(expectedSendMessageErrorMessage);
				}
			},
			{
				description: "should reject if the websocket throws error in the send method.",
				sendCore: (msg: ICloudOperationWebSocketMessage<any>): Error => {
					throw new Error(expectedSendMessageErrorMessage);
				}
			}
		];
		sendMessageRejectTestCases.forEach(c => {
			it(c.description, async () => {
				const { channel, ws } = createWebSocketCommunicationChannel();
				const promise = channel.connect();

				ws.emit("open");
				await promise;

				ws.sendCore = c.sendCore;
				await assert.isRejected(channel.sendMessage(<any>{}), expectedSendMessageErrorMessage);
			});
		});

		it("should reject if the communication channel is not connected.", async () => {
			const { channel } = createWebSocketCommunicationChannel();

			await assert.isRejected(channel.sendMessage(<any>{}), "Communication channel not connected");
		});
	});

	describe("WebSocket events", () => {
		const webSocketEvents = ["error", "close", "message"];
		webSocketEvents.forEach(event => {
			it(`should proxy the ${event} event.`, async () => {
				const { channel, ws } = createWebSocketCommunicationChannel();
				const promise = channel.connect();

				ws.emit("open");
				await promise;

				let handlerCalled = false;
				const eventPromise = new Promise((resolve) => {
					channel.on(event, () => {
						handlerCalled = true;
						resolve();
					});
				});

				ws.emit(event, {});
				await eventPromise;

				assert.isTrue(handlerCalled);
			});
		});
	});

	describe("WebSocket messages", () => {
		const serverHello = { type: "serverHello", cloudOperationId: "test", body: {} };

		const webSocketMessagesTestCases = [
			{
				messageType: "Object",
				data: serverHello
			},
			{
				messageType: "JSON string",
				data: JSON.stringify(serverHello)
			},
			{
				messageType: "Buffer",
				data: Buffer.from(JSON.stringify(serverHello))
			}
		];

		webSocketMessagesTestCases.forEach(c => {
			it(`should handle message with type ${c.messageType}.`, async () => {
				const { channel, ws } = createWebSocketCommunicationChannel();
				ws.send = (data: any, options?: any, cb?: any) => {
					ws.emit("message", c.data);
					(cb || options)(null);
				};
				const promise = channel.connect();

				ws.emit("open");
				await promise;
			});
		});
	});
});
