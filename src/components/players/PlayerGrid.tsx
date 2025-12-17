import type {FunctionComponent} from "preact";
import {useVoiceStateContext} from "../VoiceStateProvider.tsx";
import PlayerBlob from "./PlayerBlob.tsx";
import {useEffect, useMemo, useState} from "preact/hooks";
import {AudioPacket, type StateUpdatePacket} from "../../scripts/network/packets.ts";
import MinecraftComponent from "../common/MinecraftComponent.tsx";

const PlayerGrid: FunctionComponent = () => {
    const {players: [players, setPlayers], socket: [socket], user: [{serverId, serverName}]} = useVoiceStateContext();

    useEffect(() => {
        if (!socket.isActive()) {
            setPlayers({});
        }
        return socket
            .registers()
            .register("open", () => setPlayers({}))
            .register("state_update", ({detail: {state}}: CustomEvent<StateUpdatePacket>) => {
                setPlayers(players => {
                    return {...players, [state.uniqueId.name]: state};
                });
            })
            .callback();
    }, [socket]);

    const [_refresh, setRefresh] = useState<number>(0);
    useEffect(() => {
        return socket.register("audio", ({detail: {senderId, audio}}: CustomEvent<AudioPacket>) => {
            const state = players[senderId.name];
            // zero-length audio data marks the
            // end of an audio stream and resets the decoder
            const speakState = audio.length > 0;
            if (state.speaking !== speakState) {
                state.speaking = speakState;
                setRefresh(i => i + 1);
            }
        });
    }, [socket, players]);

    const playerList = useMemo(() => Object.values(players)
        .filter(player => player.on(serverId)), [players, serverId]);
    return <>
        <div className={"p-8 pb-0 w-1/2 border-l-2 border-solid border-neutral-700 flex flex-col gap-6"}>
            <div className={"flex flex-col"}>
                <span className={"text-sm"}>Current server</span>
                {serverName && <MinecraftComponent noColor className={"text-xl"} component={serverName}/>}
            </div>
            <div className={"gap-2 xl:gap-4 grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] overflow-y-auto grow"}>
                {playerList.map(state => <PlayerBlob key={state.uniqueId.name} state={state}/>)}
            </div>
        </div>
    </>;
};

export default PlayerGrid;
