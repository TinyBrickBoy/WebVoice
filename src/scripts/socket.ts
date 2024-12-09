import {EventManager} from "./events";

const WEBSOCKET_SERVER = "ws://localhost:38048"

export class VoiceSocket extends EventManager {

    public socket?: WebSocket;

    public registerToken(token: string) {
        this.register("open", () => this.json({key: "tjcsonus:auth", packet: {token}}));
    }

    public json(data: any) {
        this.send(JSON.stringify(data))
    }

    public send(data: string | ArrayBufferLike | Blob | ArrayBufferView) {
        this.socket!!.send(data)
    }

    public open() {
        const socket = new WebSocket(WEBSOCKET_SERVER, []);
        socket.onmessage = event => this.fire(event);
        socket.onopen = event => this.fire(event);
        socket.onclose = event => this.fire(event);
        socket.onerror = event => this.fire(event);
        this.socket = socket;
    }

    public close(code: number = 1002) {
        this.socket?.close(code)
    }
}
