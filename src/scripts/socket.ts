import {EventManager} from "./events";
import ByteBuffer from "bytebuffer";
import {decodeVoiceBuffer, encodeVoiceBuffer} from "./codec.ts";

const WEBSOCKET_SERVER = "wss://voice.tjcserver.net";

export class VoiceSocket extends EventManager {

    public socket?: WebSocket;

    constructor() {
        super();

        this.register("message", (event: MessageEvent) => {
            let message: { key: string; packet: any };
            if (typeof event.data === "string") {
                // meta packet (json encoded)
                message = JSON.parse(event.data);
            } else if (event.data instanceof ArrayBuffer) {
                message = decodeVoiceBuffer(ByteBuffer.wrap(event.data));
            } else {
                return;
            }
            console.log(message.key, message.packet);
            this.fire(new CustomEvent(message.key, {detail: message.packet}));
        });
    }

    public registerToken(token: string) {
        this.register("open", () => this.sendMeta({key: "tjcsonus:auth", packet: {token}}));
    }

    public sendVoice(data: { key: string, packet: any }) {
        const buf = ByteBuffer.allocate();
        encodeVoiceBuffer(buf, data);
        this.send(buf.buffer);
    }

    public sendMeta(data: any) {
        this.send(JSON.stringify(data));
    }

    public send(data: string | ArrayBufferLike | ArrayBufferView) {
        this.socket!!.send(data);
    }

    public open() {
        const socket = new WebSocket(WEBSOCKET_SERVER, []);
        socket.binaryType = "arraybuffer";
        socket.onmessage = event => this.fire(event);
        socket.onopen = event => this.fire(event);
        socket.onclose = event => this.fire(event);
        socket.onerror = event => this.fire(event);
        this.socket = socket;
    }

    public close(code: number = 1002) {
        this.socket?.close(code);
    }
}
