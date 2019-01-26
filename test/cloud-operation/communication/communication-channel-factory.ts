import { assert } from "chai";

import { Yok } from "nativescript/lib/common/yok";
import { CommunicationChannelFactory } from "../../../lib/cloud-operation/communication/communication-channel-factory";
import { WebSocketCommunicationChannel } from "../../../lib/cloud-operation/communication/websocket-channel";

describe("nsCloudCommunicationChannelFactory", () => {
	let factory: ICloudCommunicationChannelFactory;
	const createTestInjector = (): IInjector => {
		const testInjector = new Yok();

		testInjector.register("logger", {
			trace: (formatStr?: any, ...args: any[]): void => undefined,
		});
		testInjector.register("nsCloudCommunicationChannelFactory", CommunicationChannelFactory);
		testInjector.register("nsCloudWebSocketFactory", {
			create: (): any => null
		});
		testInjector.register("injector", testInjector);

		return testInjector;
	};
	beforeEach(() => {
		const injector = createTestInjector();
		factory = injector.resolve("nsCloudCommunicationChannelFactory");
	});

	describe("create", () => {
		it("should create websocket communication channel when the server returns communication channel type WebSocket.", () => {
			const ws = factory.create<any>({ type: "WebSocket", config: null }, "test");

			assert.instanceOf(ws, WebSocketCommunicationChannel);
		});

		it("should throw error if unknown communication channel is provided.", () => {
			const invalidCommunicationChannelType = "invalid";
			assert.throws(() => {
				factory.create<any>({ type: invalidCommunicationChannelType, config: null }, "test");
			}, `Unknown communication channel type: ${invalidCommunicationChannelType}`);
		});
	});
});
