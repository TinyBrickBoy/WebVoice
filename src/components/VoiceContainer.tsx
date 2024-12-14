import {useCallback, useEffect, useState} from "preact/hooks";
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
    ConnectionCheckAckPacket, SonusResetPacket,
} from "../scripts/packets.ts";
import VoiceCategories from "./VoiceCategories.tsx";
import PlayerInfos from "./PlayerInfos.tsx";
import VoiceCategory from "./VoiceCategory.tsx";

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

const VoiceContainer = (props: Props) => {
    const [player, setPlayer] = useState<string | undefined>();
    const [state, setState] = useState<string>("disconnected");
    const [socket, setSocket] = useState<VoiceSocket>(new VoiceSocket(props.socket));
    const [categories, setCategories] = useState<{ [id: string]: VoiceCategory }>({});
    const [players, setPlayers] = useState<{ [id: string]: PlayerState }>({});

    const invalidateState = useCallback(() => {
        setCategories({});
        setPlayers({});
    }, []);

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
            .register("tjcsonus:reset", (_event: CustomEvent<SonusResetPacket>) => {
                invalidateState();
            })
            .register("tjcsonus:info", (event: CustomEvent<SonusInfoPacket>) => {
                setPlayer(`${event.detail.username} (${event.detail.player.name})`);
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
            .register("connection_check_ack", (_event: CustomEvent<ConnectionCheckAckPacket>) => {
                socket.sendMeta("voicechat:update_state", {disabled: false} as UpdateStatePacket);
            })
            .register("keep_alive", (event: CustomEvent<KeepAlivePacket>) => {
                socket.sendVoice("keep_alive", event.detail);
            })
            .register("ping", (event: CustomEvent<PingPacket>) => {
                socket.sendVoice("ping", event.detail);
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
        <>
            <VoiceInfo player={player} token={props.token} socket={props.socket} state={state}/>
            <VoiceConnectButton socket={socket} openSocket={openSocket}/>
            <VoiceCategories categories={Object.values(categories)}/>
            <PlayerInfos states={Object.values(players)}/>
        </>
    );
};
export default VoiceContainer;
