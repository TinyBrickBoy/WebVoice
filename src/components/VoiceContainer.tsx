import {useCallback, useEffect, useMemo, useState} from "preact/hooks";
import VoiceInfo from "./VoiceInfo.tsx";
import VoiceConnectButton from "./VoiceConnectButton.tsx";
import {VoiceSocket} from "../scripts/socket.ts";
import type {
    AddCategoryPacket,
    PacketPlayerState,
    PlayerStatePacket,
    PlayerStatesPacket,
    SonusInfoPacket,
    PacketVoiceCategory,
    RemoveCategoryPacket,
    UpdateStatePacket,
    AuthenticatePacket,
    KeepAlivePacket,
    PingPacket,
    ConnectionCheckAckPacket,
    SonusResetPacket,
    PlayerSoundPacket,
    GroupSoundPacket,
    LocationSoundPacket,
    PacketClientGroup, AddGroupPacket, RemoveGroupPacket,
} from "../scripts/packets.ts";
import VoiceCategories from "./VoiceCategories.tsx";
import PlayerInfos from "./PlayerInfos.tsx";
import VoiceCategory from "./VoiceCategory.tsx";
import AudioPlayer from "../scripts/audio.ts";
import {getVolume} from "../scripts/volumes.ts";
import ClientGroups from "./ClientGroups.tsx";
import CreateGroupForm from "./CreateGroupForm.tsx";
import type {UUID} from "../scripts/uuid.ts";

const GARBAGE_COLLECTOR_INTERVAL = 5 * 1000;

interface Props {
    socket: URL;
    token: string;
}

export interface VoiceCategory extends PacketVoiceCategory {
    volume: number;
}

export interface PlayerState extends PacketPlayerState {
    volume: number;
}

export interface GroupState extends PacketClientGroup {
    volume: number;
}

export interface PlayerInfo {
    uuid: UUID;
    name: string;
}

const VoiceContainer = (props: Props) => {
    const [player, setPlayer] = useState<PlayerInfo | undefined>();
    const [state, setState] = useState<string>("disconnected");
    const [socket, setSocket] = useState<VoiceSocket>(new VoiceSocket(props.socket));
    const [categories, setCategories] = useState<{ [id: string]: VoiceCategory }>({});
    const [players, setPlayers] = useState<{ [id: string]: PlayerState }>({});
    const [groups, setGroups] = useState<{ [id: string]: GroupState }>({});
    const audio = useMemo(() => new AudioPlayer(), []);

    const invalidateState = useCallback(() => {
        setCategories({});
        setPlayers({});
        setGroups({});
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
            // meta packets
            .register("tjcsonus:reset", async (_event: CustomEvent<SonusResetPacket>) => {
                invalidateState();
                await audio.startContext();
            })
            .register("tjcsonus:info", (event: CustomEvent<SonusInfoPacket>) => {
                setPlayer({
                    uuid: event.detail.player,
                    name: event.detail.username,
                });
                socket.sendVoice("authenticate", {
                    player: event.detail.player,
                    secret: event.detail.secret,
                } as AuthenticatePacket);
            })
            .register("voicechat:add_category", (event: CustomEvent<AddCategoryPacket>) => {
                setCategories(categories => {
                    const prevCategory = categories[event.detail.id];
                    const volume = prevCategory?.volume || 1;
                    const newCategories = Object.assign({}, categories);
                    newCategories[event.detail.id] = {volume, ...event.detail};
                    return newCategories;
                });
            })
            .register("voicechat:remove_category", (event: CustomEvent<RemoveCategoryPacket>) => {
                setCategories(categories => {
                    const newCategories = Object.assign({}, categories);
                    delete newCategories[event.detail.categoryId];
                    return newCategories;
                });
            })
            .register("voicechat:player_states", (event: CustomEvent<PlayerStatesPacket>) => {
                setPlayers(players => {
                    const newPlayers = Object.assign({}, players);
                    event.detail.states.forEach(state => {
                        const prevState = newPlayers[state.playerId.name];
                        const volume = prevState?.volume || 1;
                        newPlayers[state.playerId.name] = {volume, ...state};
                    });
                    return newPlayers;
                });
            })
            .register("voicechat:player_state", (event: CustomEvent<PlayerStatePacket>) => {
                setPlayers(players => {
                    const newPlayers = Object.assign({}, players);
                    const prevState = newPlayers[event.detail.playerId.name];
                    const volume = prevState?.volume || 1;
                    newPlayers[event.detail.playerId.name] = {volume, ...event.detail};
                    return newPlayers;
                });
            })
            .register("voicechat:add_group", (event: CustomEvent<AddGroupPacket>) => {
                setGroups(groups => {
                    const newGroups = Object.assign({}, groups);
                    const prevState = newGroups[event.detail.groupId.name];
                    const volume = prevState?.volume || 1;
                    newGroups[event.detail.groupId.name] = {volume, ...event.detail};
                    return newGroups;
                });
            })
            .register("voicechat:remove_group", (event: CustomEvent<RemoveGroupPacket>) => {
                setGroups(groups => {
                    const newGroups = Object.assign({}, groups);
                    delete newGroups[event.detail.groupId.name];
                    return newGroups;
                });
            })
            // voice packets
            .register("connection_check_ack", (_event: CustomEvent<ConnectionCheckAckPacket>) => {
                socket.sendMeta("voicechat:update_state", {disabled: false} as UpdateStatePacket);
            })
            .register("keep_alive", (event: CustomEvent<KeepAlivePacket>) => {
                socket.sendVoice("keep_alive", event.detail);
            })
            .register("ping", (event: CustomEvent<PingPacket>) => {
                socket.sendVoice("ping", event.detail);
            })
            .register("player_sound", (event: CustomEvent<PlayerSoundPacket>) => {
                const playerVolume = getVolume("player", event.detail.sender.name) / 100;
                const categoryVolume = getVolume("category", event.detail.category) / 100;
                audio.playFrame(event.detail.channelId.name, playerVolume * categoryVolume, event.detail.data);
            })
            .register("group_sound", (event: CustomEvent<GroupSoundPacket>) => {
                const playerVolume = getVolume("player", event.detail.sender.name) / 100;
                const categoryVolume = getVolume("category", event.detail.category) / 100;
                audio.playFrame(event.detail.channelId.name, playerVolume * categoryVolume, event.detail.data);
            })
            .register("location_sound", (event: CustomEvent<LocationSoundPacket>) => {
                const playerVolume = getVolume("player", event.detail.sender.name) / 100;
                const categoryVolume = getVolume("category", event.detail.category) / 100;
                audio.playFrame(event.detail.channelId.name, playerVolume * categoryVolume, event.detail.data);
            })
            .callback();
    }, [socket]);

    const openSocket = useCallback(() => {
        setState("Disconnected");
        socket.close();

        setState("Connecting...");
        const newSocket = new VoiceSocket(props.socket);
        newSocket.registerToken(props.token);
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
                    <VoiceInfo player={player} token={props.token} socket={props.socket} state={state}/>
                    <VoiceConnectButton socket={socket} openSocket={openSocket}/>
                </div>
                {Object.values(categories).length > 0 &&
                    <div className={"container"}>
                        <VoiceCategories categories={Object.values(categories)}/>
                    </div>
                }
            </div>
            {Object.values(players).length > 0 &&
                <div className={"container"}>
                    <PlayerInfos states={Object.values(players)} groups={groups}/>
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
                        <CreateGroupForm createGroup={packet => socket.sendMeta("voicechat:create_group", packet)}/>
                    </div>
                }
                {Object.values(groups).length > 0 &&
                    <div className={"container"}>
                        <ClientGroups
                            viewerId={player?.uuid}
                            players={Object.values(players)}
                            groups={Object.values(groups)}
                            joinGroup={packet => socket.sendMeta("voicechat:set_group", packet)}
                            leaveGroup={packet => socket.sendMeta("voicechat:leave_group", packet)}
                        />
                    </div>
                }
            </div>
        </div>
    );
};
export default VoiceContainer;
