import PlayerInfo from "./PlayerInfo.tsx";
import {type PlayerState} from "../scripts/types.ts";

interface Props {
    states: PlayerState[];
}

const PlayerInfos = (props: Props) => {
    return (
        <>
            <h2>Players</h2>
            <div>
                {props.states.filter(state => !state.deafened).map(state => (
                    <PlayerInfo key={state.uniqueId.name} state={state}/>
                ))}
            </div>
        </>
    );
};
export default PlayerInfos;
