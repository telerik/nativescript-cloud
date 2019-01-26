import { CloudCommunicationChannelTypes } from "../../constants";
import { WebsocketCommunicationChannel } from "./websocket-channel";

export class CommunicationChannelFactory implements ICloudCommunicationChannelFactory {
	constructor(private $injector: IInjector) { }

	public create<T>(communicationChannelData: ICloudCommunicationChannelData<T>, cloudOperationId: string): ICloudCommunicationChannel {
		if (communicationChannelData.type === CloudCommunicationChannelTypes.WEBSOCKET) {
			return this.$injector.resolve(WebsocketCommunicationChannel, { data: communicationChannelData, cloudOperationId });
		}

		return null;
	}
}

$injector.register("nsCloudCommunicationChannelFactory", CommunicationChannelFactory);
