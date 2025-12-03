import PlayerInfo from "./PlayerInfo.tsx";
import type {FunctionComponent} from "preact";
import {useVoiceStateContext} from "./VoiceStateProvider.tsx";
import {useEffect} from "preact/hooks";
import {StateUpdatePacket} from "../scripts/network/packets.ts";
import {PlayerState} from "../scripts/types.ts";
import {uuidFromString} from "../scripts/util/uuid.ts";

const PlayerInfos: FunctionComponent = () => {
    const {socket: [socket], players: [players, setPlayers]} = useVoiceStateContext();

    useEffect(() => {
        setPlayers({}); // invalidate

        // TODO remove debug
        const players = {} as Record<string, PlayerState>;
        [
            ["c5369b7e-2295-4331-8673-251ea2ba3107", "SirReGa"],
            ["9fb636a3-4276-4c42-9773-0937248b851c", "pianoman911"],
            ["645509f1-fa50-4b00-8cbb-db07f1345a3b", "webii79"],
            ["3fef2a45-0e70-425f-8ebc-a672e5840d6a", "Herr_Aleks"],
            ["d20c8b3b-9f9e-48da-94c4-2c614dd76e29", "booky10"],
            ["5900ccc4-ced8-41db-a1f9-493b393caf2c", "LarsenR"],
            ["035509e7-a266-4cae-b791-dd5eb7c5ba46", "Heidelbeere24"],
            ["8ba375bb-37a8-477e-8771-d374786020be", "LakyLuc"],
            ["bb9ccaf6-8b2c-4548-ba97-bdf7b23c12c6", "pinomann"],
            ["a62f4c41-f9cc-4d4a-8a2f-1dcccf6dfa97", "B00KY"],
        ].forEach(([uuid, name]) => {
            players[uuid] = new PlayerState(uuidFromString(uuid), name, false, false, null);
        });
        setPlayers(players);

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

    const playerValues = Object.values(players);
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
