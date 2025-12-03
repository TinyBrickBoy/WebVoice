import PlayerInfo from "./PlayerInfo.tsx";
import type {FunctionComponent} from "preact";
import {useVoiceStateContext} from "./VoiceStateProvider.tsx";
import {useEffect} from "preact/hooks";
import {StateUpdatePacket} from "../scripts/network/packets.ts";

const PlayerInfos: FunctionComponent = () => {
    const {socket: [socket], players: [players, setPlayers]} = useVoiceStateContext();

    useEffect(() => {
        setPlayers({}); // invalidate

        // register events
        return socket.registers()
            .register("state_update", ({detail: {state}}: CustomEvent<StateUpdatePacket>) => {
                setPlayers(players => {
                    // keep volume and copy rooms record
                    state.volume = players[state.uniqueId.name]?.volume || 1;
                    return {...players, [state.uniqueId.name]: state};
                });
            })
            .callback();
    }, [socket]);

    const playerValues = Object.values(players)
    return <>
        <details open={true}>
            <summary>Players ({playerValues.length})</summary>
            <div className={"flex flex-col"}>
                {Object.values(players)
                    .filter(state => !state.deafened)
                    .map(state => (
                        <PlayerInfo key={state.uniqueId.name} state={state}/>
                    ))}
            </div>
        </details>
    </>;
};
export default PlayerInfos;
