import Sockette from "sockette"
import EventEmitter from "node:events"

const WEBSOCKET_SERVER = "wss://voice.tjcserver.net"

export class VoiceSocket extends EventEmitter {

    public socket: Sockette;

    public constructor(player: string) {
        super();
        this.socket = new Sockette(WEBSOCKET_SERVER, {
            timeout: 10e3,
            maxAttempts: 10,
            onopen: event => window.lllog("open", event),
            onmessage: event => window.lllog("message", event),
            onreconnect: event => window.lllog("reconnect", event),
            onmaximum: event => window.lllog("maximum", event),
            onclose: event => window.lllog("close", event),
            onerror: event => window.lllog("error", event),
            protocols: [ player ],
        })
    }

    public open(token: string) {
        this.socket.open();
        this.socket.json({ key: "auth", packet: { token } })
    }
}
