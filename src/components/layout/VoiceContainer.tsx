import {useEffect, useMemo} from "preact/hooks";
import {VoiceSocket} from "../../scripts/socket.ts";
import AudioPlayer from "../../scripts/audio/audio_player.ts";
import {ConnectedPacket, StateInfoPacket} from "../../scripts/network/packets.ts";
import type {FunctionComponent} from "preact";
import {useVoiceStateContext} from "../VoiceStateProvider.tsx";
import Navbar from "./Navbar.tsx";
import PlayerGrid from "../players/PlayerGrid.tsx";
import Footer from "./Footer.tsx";
import VoiceConnectModal from "../VoiceConnectModal.tsx";
import DraggableHandle from "./DraggableHandle.tsx";
import {useMediaQuery} from "../../scripts/util/hooks.ts";
import CurrentRoom from "../rooms/CurrentRoom.tsx";
import CurrentServer from "../players/CurrentServer.tsx";

interface Props {
    socketUrl: URL;
}

const VoiceContainer: FunctionComponent<Props> = ({socketUrl}) => {
    const {
        socket: [socket, setSocket],
        user: [_user, setUser],
        state: [_state, setState],
        devices,
        controls,
        volumes,
    } = useVoiceStateContext();

    // audio player handling
    const audio = useMemo(
        () => new AudioPlayer(controls, devices, volumes),
        [controls, devices, volumes],
    );
    useEffect(() => audio.startGarbageCollector(), [audio]);
    useEffect(() => audio.registerSpeakerListener(), [audio]);
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
            .callback();
    }, [socket]);

    // TODO somehow use var(--breakpoint-mg)?
    const horizontal = useMediaQuery("(width >= 50rem)");

    return <>
        <main className={"flex flex-col h-full"}>
            <VoiceConnectModal demo={socketUrl.hostname === "example"}/>
            <div className={"flex grow overflow-y-auto mg:flex-row flex-col"}>
                <div className={"mg:w-1/2 xl:w-2/5 w-full"}>
                    <Navbar>
                        <div className={"flex flex-row justify-between w-full"}>
                            {!horizontal && <CurrentServer/>}
                            <CurrentRoom/>
                        </div>
                    </Navbar>
                </div>
                {horizontal && <DraggableHandle
                    leftWidthMin={0.25}
                    leftWidthMax={0.7}
                />}
                <PlayerGrid>
                    {horizontal && <CurrentServer/>}
                </PlayerGrid>
            </div>
            <div className={"flex flex-row justify-center p-3 border-t-2 border-solid border-neutral-700"}>
                <Footer/>
            </div>
        </main>
    </>;
};

export default VoiceContainer;
