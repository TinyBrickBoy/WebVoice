import {useEffect, useMemo} from "preact/hooks";
import {VoiceSocket} from "../scripts/socket.ts";
import AudioPlayer from "../scripts/audio/audio_player.ts";
import {ConnectedPacket, PingPacket, StateInfoPacket} from "../scripts/network/packets.ts";
import type {FunctionComponent} from "preact";
import {useVoiceStateContext} from "./VoiceStateProvider.tsx";
import {Navbar} from "./Navbar.tsx";
import PlayerGrid from "./PlayerGrid.tsx";
import {UserProfile} from "./UserProfile.tsx";
import VoiceConnectModal from "./VoiceConnectModal.tsx";

interface Props {
    socketUrl: URL;
}

const VoiceContainer: FunctionComponent<Props> = ({socketUrl}) => {
    const {socket: [socket, setSocket], user: [_user, setUser], state: [_state, setState]} = useVoiceStateContext();

    // audio player handling
    const audio = useMemo(() => new AudioPlayer(), []);
    useEffect(() => audio.startGarbageCollector(), [audio]);
    useEffect(() => audio.registerSocket(socket), [audio, socket]);

    useEffect(() => {
        let connected = false;

        // register events
        return socket.registers()
            .register("open", () => setState("connected"))
            .register("close", (event: CloseEvent) => {
                console.error(`Websocket closed with ${event.code}: ${event.reason}`, event);
                setState("disconnected");
                setSocket(new VoiceSocket(socketUrl));
            })
            .register("connected", ({detail: packet}: CustomEvent<ConnectedPacket>) => {
                // save player info
                setUser({
                    ...packet,
                    uuid: packet.playerId,
                    name: packet.username,
                });
                // this packet may be sent multiple times during one connection,
                // don't restart audio context if we don't need to
                if (!connected) {
                    connected = true;
                    // start audio
                    audio.startContext()
                        .then(() => {
                            // inform the server we are able to send audio
                            socket.sendPacket(new StateInfoPacket(false, false));
                        })
                        .catch(error => console.error(error));
                }
            })
            .register("ping", (event: CustomEvent<PingPacket>) => {
                // TODO
            })
            .callback();
    }, [socket]);

    return <>
        <main className={"flex flex-col h-full"}>
            {socketUrl.hostname !== "example" /*TODO*/ && <VoiceConnectModal/>}
            <div className={"flex flex-row grow overflow-y-scroll"}>
                <Navbar/>
                <PlayerGrid/>
            </div>
            <div className={"flex flex-row justify-center p-3 border-t-2 border-solid border-neutral-700"}>
                <UserProfile/>
            </div>
        </main>
    </>;
};
export default VoiceContainer;
