import {useEffect, useMemo} from "preact/hooks";
import {VoiceSocket} from "../scripts/socket.ts";
import AudioPlayer from "../scripts/audio/audio_player.ts";
import {ConnectedPacket, PingPacket, StateInfoPacket} from "../scripts/network/packets.ts";
import type {FunctionComponent} from "preact";
import {useVoiceStateContext} from "./VoiceStateProvider.tsx";
import {Navbar} from "./Navbar.tsx";

interface Props {
    socketUrl: URL;
}

const VoiceContainer: FunctionComponent<Props> = ({socketUrl}) => {
    const {socket: [socket, setSocket], user: [_user, setUser], state: [_state, setState]} = useVoiceStateContext();

    // audio player handling
    const audio = useMemo(() => new AudioPlayer(), []);
    useEffect(() => audio.startGarbageCollector, [audio]);
    useEffect(() => audio.registerSocket(socket), [audio, socket]);

    useEffect(() => {
        // register events
        return socket.registers()
            .register("open", () => setState("connected"))
            .register("close", (event: CloseEvent) => {
                console.error(`Websocket closed with ${event.code}: ${event.reason}`, event);
                setState("disconnected");
                setSocket(new VoiceSocket(socketUrl));
            })
            .register("connected", (event: CustomEvent<ConnectedPacket>) => {
                // save player info
                setUser({
                    uuid: event.detail.playerId,
                    name: event.detail.username,
                });
                // start audio
                audio.startContext()
                    .then(() => {
                        // inform the server we are able to send audio
                        socket.sendPacket(new StateInfoPacket(false, false));
                    })
                    .catch(error => console.error(error));
            })
            .register("ping", (event: CustomEvent<PingPacket>) => {
                // TODO
            })
            .callback();
    }, [socket]);

    return <>
        <main className={"flex flex-row h-full"}>
            <Navbar/>
            <div className={"grow"}>
                <span>spast</span>
            </div>
        </main>
    </>;
};
export default VoiceContainer;
;
