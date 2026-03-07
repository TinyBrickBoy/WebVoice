import {EventManager} from "./util/events";
import ByteBuffer from "bytebuffer";
import {KeepAlivePacket, Packet} from "./network/packets.ts";
import {readPacket, writePacket} from "./network/packet_registry.ts";

export class VoiceSocket extends EventManager {

    public readonly socketUrl: URL;
    public socket: WebSocket | null = null;

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
            if (!(packet.packet instanceof KeepAlivePacket)) {
                console.log("CLIENTBOUND", packet.id, packet.packet);
            }
            // fire as event to be handled
            this.fire(new CustomEvent(packet.id, {detail: packet.packet}));
        });
        this.register("error", error => console.error(error));
        this.register("close", () => this.socket = null);

        // always send back keep alive packets
        this.register("keep_alive", ({detail}: CustomEvent<KeepAlivePacket>) => this.sendPacket(detail));
    }

    public sendPacket(packet: Packet) {
        if (!this.socket) {
            console.warn("Skipped sending packet because socket isn't connected", packet);
            return;
        }
        if (!(packet instanceof KeepAlivePacket)) {
            console.log("SERVICEBOUND", packet);
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
        this.close();

        const socket = new WebSocket(this.socketUrl.toString(), []);
        socket.binaryType = "arraybuffer";
        socket.onmessage = event => this.fire(event);
        socket.onerror = event => this.fire(event);
        socket.onopen = event => {
            this.socket = socket;
            this.fire(event);
        };
        socket.onclose = event => {
            this.fire(event);
            this.socket = null;
        };
    }

    public close(code: number = 1002) {
        this.socket?.close(code);
    }

    public isActive() {
        return !!this.socket;
    }
}
