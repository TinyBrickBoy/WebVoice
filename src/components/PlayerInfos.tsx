import type {PlayerState} from "./VoiceContainer.tsx";
import PlayerInfo from "./PlayerInfo.tsx";

interface Props {
    states: PlayerState[];
}

const PlayerInfos = (props: Props) => {
    return props.states.length ?
        <>
            <h2 style={{marginBottom: "0"}}>Players</h2>
            <div>
                {props.states.map(state => (
                    <PlayerInfo key={state.playerId.name} {...state} />
                ))}
            </div>
        </> : <></>;
};
export default PlayerInfos;