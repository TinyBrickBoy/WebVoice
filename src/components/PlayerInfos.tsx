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

    return Object.values(players).length ?
        <div className={"container"}>
            <h2>Players</h2>
            <div>
                {Object.values(players)
                    .filter(state => !state.deafened)
                    .map(state => (
                        <PlayerInfo key={state.uniqueId.name} state={state}/>
                    ))}
            </div>
        </div> : <></>;
};
export default PlayerInfos;
