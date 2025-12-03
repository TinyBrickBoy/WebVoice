import {useCallback, useEffect, useMemo, useState} from "preact/hooks";
import VoiceInfo from "./VoiceInfo.tsx";
import VoiceConnectButton from "./VoiceConnectButton.tsx";
import {VoiceSocket} from "../scripts/socket.ts";
import VoiceCategories from "./VoiceCategories.tsx";
import PlayerInfos from "./PlayerInfos.tsx";
import AudioPlayer from "../scripts/audio/audio_player.ts";
import ClientGroups from "./ClientGroups.tsx";
import CreateGroupForm from "./CreateGroupForm.tsx";
import MicContainer from "./MicContainer.tsx";
import {ConnectedPacket, PingPacket, StateInfoPacket} from "../scripts/network/packets.ts";
import type {FunctionComponent} from "preact";
import {useVoiceStateContext} from "./VoiceStateProvider.tsx";

interface Props {
    socketUrl: URL;
    token: string;
}

const VoiceContainer: FunctionComponent<Props> = ({socketUrl, token}) => {
    const [state, setState] = useState<string>("disconnected");
    const {socket: [socket, setSocket], user: [user, setUser]} = useVoiceStateContext();

    // audio player handling
    const audio = useMemo(() => new AudioPlayer(), []);
    useEffect(() => audio.startGarbageCollector, [audio]);
    useEffect(() => audio.registerSocket(socket), [audio, socket]);

    useEffect(() => {
        // register events
        return socket.registers()
            .register("open", () => setState("Connected"))
            .register("close", (event: CloseEvent) => {
                console.error(`Websocket closed with ${event.code}: ${event.reason}`, event);
                setState(`Disconnected: ${event.reason} (${event.code})`);
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

    const openSocket = useCallback(() => {
        setState("Disconnected");
        socket.close();

        setState("Connecting...");
        const newSocket = new VoiceSocket(socketUrl);
        newSocket.open();
        setSocket(newSocket);
    }, [socket]);

    return (
        <div style={{
            display: "flex",
            gap: "0.5rem",
            alignItems: "flex-start",
        }}>
            <div style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
            }}>
                <div
                    className={"container"}
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "1em",
                    }}
                >
                    <VoiceInfo token={token} socketUrl={socketUrl} state={state}/>
                    <VoiceConnectButton openSocket={openSocket}/>
                </div>
                {(socket.isLoaded() && user) &&
                    <div className={"container"}>
                        <MicContainer/>
                    </div>
                }
                <VoiceCategories/>
            </div>
            <PlayerInfos/>
            <div style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
            }}>
                {(socket.isLoaded() && user) &&
                    <div className={"container"}>
                        <h2>Create Group</h2>
                        <CreateGroupForm/>
                    </div>
                }
                <ClientGroups/>
            </div>
        </div>
    );
};
export default VoiceContainer;
