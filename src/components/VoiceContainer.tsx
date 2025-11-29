import {useCallback, useEffect, useMemo, useState} from "preact/hooks";
import VoiceInfo from "./VoiceInfo.tsx";
import VoiceConnectButton from "./VoiceConnectButton.tsx";
import {VoiceSocket} from "../scripts/socket.ts";
import VoiceCategories from "./VoiceCategories.tsx";
import PlayerInfos from "./PlayerInfos.tsx";
import AudioPlayer from "../scripts/audio.ts";
import {getVolume} from "../scripts/volumes.ts";
import ClientGroups from "./ClientGroups.tsx";
import CreateGroupForm from "./CreateGroupForm.tsx";
import type {UUID} from "../scripts/uuid.ts";
import {getCurrentTimeString} from "../scripts/util.ts";
import MicContainer from "./MicContainer.tsx";
import {
    AudioPacket,
    CategoryAddPacket,
    CategoryRemovePacket,
    ConnectedPacket,
    KeepAlivePacket,
    PingPacket,
    PositionUpdatePacket,
    RoomAddPacket,
    RoomJoinResponsePacket,
    RoomRemovePacket,
    StateInfoPacket,
    StateUpdatePacket,
} from "../scripts/packets.ts";
import {type AudioCategory, AudioRoom, PlayerState} from "../scripts/types.ts";
import {renderComponent} from "../scripts/component.ts";

const GARBAGE_COLLECTOR_INTERVAL = 5 * 1000;
const INFO_DURATION = 10 * 1000;

interface Props {
    socket: URL;
    token: string;
}

export interface PlayerInfo {
    uuid: UUID;
    name: string;
}

const VoiceContainer = (props: Props) => {
    const [player, setPlayer] = useState<PlayerInfo | undefined>();
    const [state, setState] = useState<string>("disconnected");
    const [info, setInfo] = useState<string | undefined>();
    const [socket, setSocket] = useState<VoiceSocket>(new VoiceSocket(props.socket));
    const [categories, setCategories] = useState<{ [id: string]: AudioCategory }>({});
    const [players, setPlayers] = useState<{ [id: string]: PlayerState }>({});
    const [groups, setGroups] = useState<{ [id: string]: AudioRoom }>({});
    const audio = useMemo(() => new AudioPlayer(), []);

    const invalidateState = useCallback(() => {
        setCategories({});
        setPlayers({});
        setGroups({});
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
                setSocket(new VoiceSocket(props.socket));
            })
            // sonus packets
            .register("audio", async (event: CustomEvent<AudioPacket>) => {
                // TODO position
                const playerVolume = getVolume("player", event.detail.senderId.name) / 100;
                const categoryVolume = getVolume("category", event.detail.categoryId?.name) / 100;
                await audio.playFrame(event.detail.channelId.name, playerVolume * categoryVolume, event.detail.audio);
            })
            .register("category_add", (event: CustomEvent<CategoryAddPacket>) => {
                setCategories(categories => {
                    const category = event.detail.category;
                    // keep volume
                    const prevCategory = categories[category.uniqueId.name];
                    category.volume = prevCategory?.volume || 1;
                    // copy categories
                    const newCategories = Object.assign({}, categories);
                    newCategories[category.uniqueId.name] = category;
                    return newCategories;
                });
            })
            .register("category_remove", (event: CustomEvent<CategoryRemovePacket>) => {
                setCategories(categories => {
                    const newCategories = Object.assign({}, categories);
                    delete newCategories[event.detail.categoryId.name];
                    return newCategories;
                });
            })
            .register("connected", async (event: CustomEvent<ConnectedPacket>) => {
                // save player info
                setPlayer({
                    uuid: event.detail.playerId,
                    name: renderComponent(event.detail.username),
                });
                // start audio
                await audio.startContext();
                // inform the server we are able to send audio
                socket.sendPacket(new StateInfoPacket(false, false));
            })
            .register("position_update", (event: CustomEvent<PositionUpdatePacket>) => {
                // TODO
            })
            .register("room_add", (event: CustomEvent<RoomAddPacket>) => {
                setGroups(groups => {
                    const room = event.detail.room;
                    // keep volume
                    const prevGroup = groups[room.uniqueId.name];
                    room.volume = prevGroup?.volume || 1;
                    // copy groups
                    const newGroups = Object.assign({}, groups);
                    newGroups[room.uniqueId.name] = room;
                    return newGroups;
                });
            })
            .register("room_join_response", (event: CustomEvent<RoomJoinResponsePacket>) => {
                if (!event.detail.success) {
                    setInfo(`[${getCurrentTimeString()}] Wrong password, please try again!`);
                }
            })
            .register("room_remove", (event: CustomEvent<RoomRemovePacket>) => {
                setGroups(groups => {
                    const newGroups = Object.assign({}, groups);
                    delete newGroups[event.detail.roomId.name];
                    return newGroups;
                });
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
        const newSocket = new VoiceSocket(props.socket);
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
                    <VoiceInfo player={player} token={props.token} socket={props.socket} state={state}/>
                    {info && <code>{info}</code>}
                    <VoiceConnectButton socket={socket} openSocket={openSocket}/>
                </div>
                {(socket.isLoaded() && player) &&
                    <div className={"container"}>
                        <MicContainer sendPacket={packet => socket.sendPacket(packet)}/>
                    </div>
                }
                {Object.values(categories).length > 0 &&
                    <div className={"container"}>
                        <VoiceCategories categories={Object.values(categories)}/>
                    </div>
                }
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
                {Object.values(groups).length > 0 &&
                    <div className={"container"}>
                        <ClientGroups
                            viewerId={player?.uuid}
                            players={Object.values(players)}
                            rooms={Object.values(groups)}
                            sendPacket={packet => socket.sendPacket(packet)}
                        />
                    </div>
                }
            </div>
        </div>
    );
};
export default VoiceContainer;
