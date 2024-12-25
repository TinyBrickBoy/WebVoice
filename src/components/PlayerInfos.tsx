import type {GroupState, PlayerState} from "./VoiceContainer.tsx";
import PlayerInfo from "./PlayerInfo.tsx";

interface Props {
    states: PlayerState[];
    groups: { [id: string]: GroupState };
}

const PlayerInfos = (props: Props) => {
    return (
        <>
            <h2>Players</h2>
            <div>
                {props.states.filter(state => !state.disconnected).map(state => (
                    <PlayerInfo
                        key={state.playerId.name} {...state}
                        group={state.groupId?.name}
                    />
                ))}
            </div>
        </>
    );
};
export default PlayerInfos;