import {useCallback, useEffect, useMemo, useState} from "preact/hooks";
import VoiceInfo from "./VoiceInfo.tsx";
import VoiceConnectButton from "./VoiceConnectButton.tsx";
import {VoiceSocket} from "../scripts/socket.ts";
import VoiceCategories from "./VoiceCategories.tsx";
import PlayerInfos from "./PlayerInfos.tsx";
import AudioPlayer from "../scripts/audio/audio_player.ts";
import ClientGroups from "./ClientGroups.tsx";
import CreateGroupForm from "./CreateGroupForm.tsx";
import {getCurrentTimeString} from "../scripts/util/util.ts";
import MicContainer from "./MicContainer.tsx";
import {
    ConnectedPacket,
    KeepAlivePacket,
    PingPacket,
    RoomJoinResponsePacket,
    StateInfoPacket,
} from "../scripts/network/packets.ts";
import type {FunctionComponent} from "preact";
import {useVoiceStateContext} from "./VoiceStateProvider.tsx";

// TODO cleanup

const INFO_DURATION = 10 * 1000;

interface Props {
    socketUrl: URL;
    token: string;
}

const VoiceContainer: FunctionComponent<Props> = ({socketUrl, token}) => {
    const [state, setState] = useState<string>("disconnected");
    const [info, setInfo] = useState<string | undefined>();
    const {socket: [socket, setSocket], user: [user, setUser]} = useVoiceStateContext();

    // audio player handling
    const audio = useMemo(() => new AudioPlayer(), []);
    useEffect(() => audio.startGarbageCollector, [audio]);
    useEffect(() => audio.registerSocket(socket), [audio, socket]);

    useEffect(() => {
        // invalidate
        setInfo(undefined);

        // register events
        return socket.registers()
            .register("open", () => setState("Connected"))
            .register("error", console.error)
            .register("close", (event: CloseEvent) => {
                console.error(`Websocket closed with ${event.code}: ${event.reason}`, event);
                setState(`Disconnected: ${event.reason} (${event.code})`);
                setSocket(new VoiceSocket(socketUrl));
            })
            // sonus packets
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
            .register("room_join_response", (event: CustomEvent<RoomJoinResponsePacket>) => {
                if (!event.detail.success) {
                    setInfo(`[${getCurrentTimeString()}] Wrong password, please try again!`);
                }
            })
            .register("keep_alive", (event: CustomEvent<KeepAlivePacket>) => {
                socket.sendPacket(event.detail);
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

    // deactivate info after short period of time
    useEffect(() => {
        if (!info) return;
        const timer = setTimeout(() => setInfo(undefined), INFO_DURATION);
        return () => clearTimeout(timer);
    }, [info]);

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
                    {info && <code>{info}</code>}
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
