import {useCallback, useEffect, useMemo, useState} from "preact/hooks";
import VoiceInfo from "./VoiceInfo.tsx";
import VoiceConnectButton from "./VoiceConnectButton.tsx";
import {VoiceSocket} from "../scripts/socket.ts";
import VoiceCategories from "./VoiceCategories.tsx";
import PlayerInfos from "./PlayerInfos.tsx";
import AudioPlayer from "../scripts/audio/audio.ts";
import {getVolume} from "../scripts/util/volumes.ts";
import ClientGroups from "./ClientGroups.tsx";
import CreateGroupForm from "./CreateGroupForm.tsx";
import type {UUID} from "../scripts/util/uuid.ts";
import {getCurrentTimeString} from "../scripts/util/util.ts";
import MicContainer from "./MicContainer.tsx";
import {
    AudioPacket,
    ConnectedPacket,
    KeepAlivePacket,
    PingPacket,
    PositionUpdatePacket,
    RoomJoinResponsePacket,
    StateInfoPacket,
    StateUpdatePacket,
} from "../scripts/network/packets.ts";
import {PlayerState} from "../scripts/types.ts";
import type {Component} from "../scripts/network/component.ts";
import type {FunctionComponent} from "preact";

// TODO cleanup

const GARBAGE_COLLECTOR_INTERVAL = 5 * 1000;
const INFO_DURATION = 10 * 1000;

interface Props {
    socket: URL;
    token: string;
}

export interface PlayerInfo {
    uuid: UUID;
    name: Component;
}

const VoiceContainer: FunctionComponent<Props> = ({socket: socketUrl, token}) => {
    const [player, setPlayer] = useState<PlayerInfo | undefined>();
    const [state, setState] = useState<string>("disconnected");
    const [info, setInfo] = useState<string | undefined>();
    const [socket, setSocket] = useState<VoiceSocket>(new VoiceSocket(socketUrl));
    const [players, setPlayers] = useState<{ [id: string]: PlayerState }>({});
    const audio = useMemo(() => new AudioPlayer(), []);

    const invalidateState = useCallback(() => {
        setPlayers({});
        setInfo(undefined);
    }, []);

    useEffect(() => {
        const timer = setInterval(() => audio.runGarbageCollector(), GARBAGE_COLLECTOR_INTERVAL);
        return () => clearInterval(timer);
    }, [audio]);

    useEffect(() => {
        return socket.registers()
            .register("open", () => setState("Connected"))
            .register("error", console.error)
            .register("close", (event: CloseEvent) => {
                console.error(`Websocket closed with ${event.code}: ${event.reason}`, event);
                setState(`Disconnected: ${event.reason} (${event.code})`);

                invalidateState();
                setSocket(new VoiceSocket(socketUrl));
            })
            // sonus packets
            .register("audio", (event: CustomEvent<AudioPacket>) => {
                // TODO position
                const playerVolume = getVolume("player", event.detail.senderId.name) / 100;
                const categoryVolume = getVolume("category", event.detail.categoryId?.name) / 100;
                audio.playFrame(event.detail.channelId.name, playerVolume * categoryVolume, event.detail.audio)
                    .catch(error => console.error(error));
            })
            .register("connected", (event: CustomEvent<ConnectedPacket>) => {
                // save player info
                setPlayer({
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
            .register("position_update", (event: CustomEvent<PositionUpdatePacket>) => {
                // TODO
            })
            .register("room_join_response", (event: CustomEvent<RoomJoinResponsePacket>) => {
                if (!event.detail.success) {
                    setInfo(`[${getCurrentTimeString()}] Wrong password, please try again!`);
                }
            })
            .register("state_update", (event: CustomEvent<StateUpdatePacket>) => {
                setPlayers(players => {
                    const state = event.detail.state;
                    // keep volume
                    const prevState = players[state.uniqueId.name];
                    state.volume = prevState?.volume || 1;
                    // copy players
                    const newPlayers = Object.assign({}, players);
                    newPlayers[state.uniqueId.name] = state;
                    return newPlayers;
                });
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
                    <VoiceInfo player={player} token={token} socket={socketUrl} state={state}/>
                    {info && <code>{info}</code>}
                    <VoiceConnectButton socket={socket} openSocket={openSocket}/>
                </div>
                {(socket.isLoaded() && player) &&
                    <div className={"container"}>
                        <MicContainer sendPacket={packet => socket.sendPacket(packet)}/>
                    </div>
                }
                <VoiceCategories socket={socket}/>
            </div>
            {Object.values(players).length > 0 &&
                <div className={"container"}>
                    <PlayerInfos states={Object.values(players)}/>
                </div>
            }
            <div style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
            }}>
                {(socket.isLoaded() && player) &&
                    <div className={"container"}>
                        <h2>Create Group</h2>
                        <CreateGroupForm sendPacket={packet => socket.sendPacket(packet)}/>
                    </div>
                }
                <ClientGroups
                    socket={socket}
                    viewerId={player?.uuid}
                    players={Object.values(players)}
                    sendPacket={packet => socket.sendPacket(packet)}
                />
            </div>
        </div>
    );
};
export default VoiceContainer;
