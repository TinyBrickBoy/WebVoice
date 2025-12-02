import {EventManager} from "./util/events";
import ByteBuffer from "bytebuffer";
import {Packet} from "./network/packets.ts";
import {readPacket, writePacket} from "./network/packet_registry.ts";

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
            // read the packet
            const buf = ByteBuffer.wrap(event.data);
            const packet = readPacket(buf.reset());
            // fire as event to be handled
            this.fire(new CustomEvent(packet.id, {detail: packet.packet}));
        });
    }

    public sendPacket(packet: Packet) {
        if (!this.socket) {
            console.warn("Skipped sending packet because socket isn't connected", packet);
            return;
        }
        // write to new buffer
        const buf = ByteBuffer.allocate();
        writePacket(buf, packet);
        // convert buffer to arraybuffer and send
        buf.limit = buf.offset;
        buf.reset();
        this.socket!!.send(buf.toArrayBuffer());
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
