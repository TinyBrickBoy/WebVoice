import PlayerInfo from "./PlayerInfo.tsx";
import {type PlayerState} from "../scripts/types.ts";
import type {FunctionComponent} from "preact";

interface Props {
    states: PlayerState[];
}

const PlayerInfos: FunctionComponent<Props> = ({states}) => {
    return (
        <>
            <h2>Players</h2>
            <div>
                {states.filter(state => !state.deafened).map(state => (
                    <PlayerInfo key={state.uniqueId.name} state={state}/>
                ))}
            </div>
        </>
    );
};
export default PlayerInfos;
