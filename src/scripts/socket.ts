import {EventManager} from "./events";
import ByteBuffer from "bytebuffer";
import {decodeVoiceBuffer, encodeVoiceBuffer} from "./voice_codec.ts";
import {decodeMetaJson, encodeMetaJson} from "./meta_codec.ts";
import type {SonusAuthPacket} from "./packets.ts";

const WEBSOCKET_SERVER = "wss://voice.tjcserver.net";

export class VoiceSocket extends EventManager {

    public socket?: WebSocket;

    constructor() {
        super();

        this.register("message", (event: MessageEvent) => {
            let message: { key: string; packet: any };
            if (typeof event.data === "string") {
                message = decodeMetaJson(JSON.parse(event.data));
            } else if (event.data instanceof ArrayBuffer) {
                message = decodeVoiceBuffer(ByteBuffer.wrap(event.data));
            } else {
                return;
            }
            console.log("Received socket message", message.key, message.packet);
            this.fire(new CustomEvent(message.key, {detail: message.packet}));
        });
    }

    public registerToken(token: string) {
        this.register("open", () => this.sendMeta("tjcsonus:auth", {token} as SonusAuthPacket));
    }

    public sendVoice(key: string, packet: any) {
        console.log("Sending socket message", key, packet);
        const buf = ByteBuffer.allocate();
        encodeVoiceBuffer(buf, {key, packet});
        this.send(buf.buffer);
    }

    public sendMeta(key: string, packet: any) {
        console.log("Sending socket message", key, packet);
        this.send(JSON.stringify(encodeMetaJson({key, packet})));
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
