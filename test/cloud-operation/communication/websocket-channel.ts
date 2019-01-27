import { assert } from "chai";

import { Yok } from "nativescript/lib/common/yok";
import { CommunicationChannelFactory } from "../../../lib/cloud-operation/communication/communication-channel-factory";
import { CommunicationChannelBase } from "../../../lib/cloud-operation/communication/communication-channel-base";
import { WebSocketMock } from "../mocks/websocket-mock";
import { CloudOperationMessageTypes, CloudCommunicationEvents } from "../../../lib/constants";

describe.only("WebSocket communication channel", () => {
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
	});

	describe("ping", () => {
		const expectedEchoesMissing = 6;
		const pingInterval = 1;
		const missingPingsExitCode = 129;
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
			assert.deepEqual(actualCode, 129);
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
			assert.notDeepEqual(actualCode, missingPingsExitCode);
		});
	});
});
