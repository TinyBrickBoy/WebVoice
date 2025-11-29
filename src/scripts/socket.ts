import {EventManager} from "./events";
import ByteBuffer from "bytebuffer";
import {Packet} from "./packets.ts";
import {readPacket, writePacket} from "./packet_registry.ts";

export class VoiceSocket extends EventManager {

    public readonly socketUrl: URL;
    public socket?: WebSocket;

    constructor(socketUrl: URL) {
        super();
        this.socketUrl = socketUrl;

        this.register("message", (event: MessageEvent) => {
            if (!(event.data instanceof ArrayBuffer)) {
                return; // we only expect buffers
            }
            const packet = readPacket(ByteBuffer.wrap(event.data));
            this.fire(new CustomEvent(packet.id, {detail: packet.packet}));
        });
    }

    public sendPacket(packet: Packet) {
        const buf = ByteBuffer.allocate();
        writePacket(buf, packet);

        buf.limit = buf.offset;
        buf.reset();
        this.send(buf.toArrayBuffer());
    }

    public send(data: string | ArrayBufferLike | ArrayBufferView) {
        this.socket!!.send(data);
    }

    public open() {
        const socket = new WebSocket(this.socketUrl.toString(), []);
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

    public isLoaded() {
        return !!this.socket;
    }
}
