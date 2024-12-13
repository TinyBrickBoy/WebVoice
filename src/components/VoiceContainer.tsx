import {useState} from "preact/hooks";
import VoiceInfo from "./VoiceInfo.tsx";
import VoiceConnectButton from "./VoiceConnectButton.tsx";
import {VoiceSocket} from "../scripts/socket.ts";
import type {
    AddCategoryPacket,
    PacketPlayerState, PlayerStatePacket,
    PlayerStatesPacket,
    SonusInfoPacket,
    PacketVoiceCategory,
} from "../scripts/packets.ts";
import Category from "./VoiceCategory.tsx";
import PlayerInfo from "./PlayerInfo.tsx";
import VoiceCategories from "./VoiceCategories.tsx";
import PlayerInfos from "./PlayerInfos.tsx";

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
    const [socket, setSocket] = useState<VoiceSocket | undefined>();
    const [categories, setCategories] = useState<VoiceCategory[]>([]);
    const [players, setPlayers] = useState<Map<string, PlayerState>>(new Map());

    const openSocket = (socket?: VoiceSocket) => {
        if (socket) {
            setState("Connecting...");
            socket.register("open", () => setState("Connected"));
            socket.register("error", console.error);
            socket.register("close", (event: CloseEvent) => {
                console.error(`Websocket closed with ${event.code}: ${event.reason}`, event);
                setState(`Disconnected: ${event.reason} (${event.code})`);
            });

            socket.register("tjcsonus:info", (event: CustomEvent<SonusInfoPacket>) => {
                setPlayer(`${event.detail.username} (${event.detail.player})`);
            });
            socket.register("voicechat:add_category", (event: CustomEvent<AddCategoryPacket>) => {
                setCategories([...categories, {volume: 1, ...event.detail}]);
            });
            socket.register("voicechat:player_states", (event: CustomEvent<PlayerStatesPacket>) => {
                event.detail.states.forEach(state => {
                    const prevState = players.get(state.playerId);
                    const volume = prevState?.volume || 1;
                    players.set(state.playerId, {volume, ...state});
                });
                setPlayers(players);
            });
            socket.register("voicechat:player_state", (event: CustomEvent<PlayerStatePacket>) => {
                const prevState = players.get(event.detail.playerId);
                const volume = prevState?.volume || 1;
                players.set(event.detail.playerId, {volume, ...event.detail});
                setPlayers(players);
            });

            socket.registerToken(props.token);
            socket.open();
        }
        setSocket(socket);
    };

    return <>
        <VoiceInfo player={player} token={props.token} state={state}/>
        <div>
            <VoiceConnectButton setSocket={openSocket}/>
        </div>
        <VoiceCategories categories={categories}/>
        <PlayerInfos states={players.values().toArray()}/>
    </>;
};
export default VoiceContainer;
