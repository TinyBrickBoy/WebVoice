import {useCallback, useEffect, useState} from "preact/hooks";
import VoiceInfo from "./VoiceInfo.tsx";
import VoiceConnectButton from "./VoiceConnectButton.tsx";
import {VoiceSocket} from "../scripts/socket.ts";
import type {
    AddCategoryPacket,
    PacketPlayerState, PlayerStatePacket,
    PlayerStatesPacket,
    SonusInfoPacket,
    PacketVoiceCategory, RemoveCategoryPacket,
} from "../scripts/packets.ts";
import VoiceCategories from "./VoiceCategories.tsx";
import PlayerInfos from "./PlayerInfos.tsx";
import {getMapValues} from "../scripts/util.ts";

interface Props {
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
    const [socket, setSocket] = useState<VoiceSocket>(new VoiceSocket());
    const [categories, setCategories] = useState<Map<string, VoiceCategory>>(new Map());
    const [players, setPlayers] = useState<Map<string, PlayerState>>(new Map());

    useEffect(() => {
        return socket.registers()
            .register("open", () => setState("Connected"))
            .register("error", console.error)
            .register("close", (event: CloseEvent) => {
                console.error(`Websocket closed with ${event.code}: ${event.reason}`, event);
                setState(`Disconnected: ${event.reason} (${event.code})`);
            })
            .register("tjcsonus:info", (event: CustomEvent<SonusInfoPacket>) => {
                setPlayer(`${event.detail.username} (${event.detail.player})`);
            })
            .callback();
    }, [socket]);

    useEffect(() => {
        return socket
            .registers()
            .register("voicechat:add_category", (event: CustomEvent<AddCategoryPacket>) => {
                const prevCategory = categories.get(event.detail.id);
                const volume = prevCategory?.volume || 1;
                categories.set(event.detail.id, {volume, ...event.detail});
                setCategories(categories);
            })
            .register("voicechat:remove_category", (event: CustomEvent<RemoveCategoryPacket>) => {
                categories.delete(event.detail.categoryId);
                setCategories(categories);
            })
            .callback();
    }, [socket, categories]);

    useEffect(() => {
        return socket
            .registers()
            .register("voicechat:player_states", (event: CustomEvent<PlayerStatesPacket>) => {
                event.detail.states.forEach(state => {
                    const prevState = players.get(state.playerId);
                    const volume = prevState?.volume || 1;
                    players.set(state.playerId, {volume, ...state});
                });
                setPlayers(players);
            })
            .register("voicechat:player_state", (event: CustomEvent<PlayerStatePacket>) => {
                const prevState = players.get(event.detail.playerId);
                const volume = prevState?.volume || 1;
                players.set(event.detail.playerId, {volume, ...event.detail});
                setPlayers(players);
            })
            .callback();
    }, [socket, players]);

    const openSocket = useCallback(() => {
        setState("Disconnected");
        socket.close();

        setState("Connecting...");
        const newSocket = new VoiceSocket();
        newSocket.registerToken(props.token);
        newSocket.open();
        setSocket(newSocket);
    }, [socket]);

    return (
        <>
            <VoiceInfo player={player} token={props.token} state={state}/>
            <VoiceConnectButton socket={socket} openSocket={openSocket}/>
            <VoiceCategories categories={getMapValues(categories)}/>
            <PlayerInfos states={getMapValues(players)}/>
        </>
    );
};
export default VoiceContainer;
