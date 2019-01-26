import * as WebSocket from "ws";

export class WebSocketFactory implements IWebSocketFactory {
    public create(url: string): IWebSocket {
        return new WebSocket(url);
    }
}

$injector.register("nsCloudWebSocketFactory", WebSocketFactory);
