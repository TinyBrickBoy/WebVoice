import Sockette from "sockette"
import { EventManager } from "./events";

const WEBSOCKET_SERVER = "wss://voice.tjcserver.net"

export class VoiceSocket extends EventManager {

    public socket: Sockette;

    public constructor(player: string) {
        super();
        this.socket = new Sockette(WEBSOCKET_SERVER, {
            timeout: 10e3,
            maxAttempts: 2,
            onopen: event => this.fire(event),
            onmessage: event => this.fire(event),
            onreconnect: event => this.fire(event),
            onmaximum: event => this.fire(event),
            onclose: event => this.fire(event),
            onerror: event => this.fire(event),
            protocols: [ player ],
        })
    }

    public open(token: string) {
        this.socket.open();
        this.socket.json({ key: "auth", packet: { token } })
    }
}
