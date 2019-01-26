import { CloudCommunicationChannelTypes } from "../../constants";
import { WebSocketCommunicationChannel } from "./websocket-channel";

export class CommunicationChannelFactory implements ICloudCommunicationChannelFactory {
	constructor(private $injector: IInjector) { }

	public create<T>(communicationChannelData: ICloudCommunicationChannelData<T>, cloudOperationId: string): ICloudCommunicationChannel {
		if (communicationChannelData.type === CloudCommunicationChannelTypes.WEBSOCKET) {
			return this.$injector.resolve(WebSocketCommunicationChannel, { data: communicationChannelData, cloudOperationId });
		}

		throw new Error(`Unknown communication channel type: ${communicationChannelData.type}`);
	}
}

$injector.register("nsCloudCommunicationChannelFactory", CommunicationChannelFactory);
