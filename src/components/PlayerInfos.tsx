import type {GroupState, PlayerState} from "./VoiceContainer.tsx";
import PlayerInfo from "./PlayerInfo.tsx";

interface Props {
    states: PlayerState[];
    groups: { [id: string]: GroupState };
}

const PlayerInfos = (props: Props) => {
    return props.states.length ?
        <>
            <h2 style={{marginBottom: "0"}}>Players</h2>
            <div>
                {props.states.filter(state => !state.disconnected).map(state => (
                    <PlayerInfo
                        key={state.playerId.name} {...state}
                        group={state.groupId ? props.groups[state.groupId.name]?.name : undefined}
                    />
                ))}
            </div>
        </> : <></>;
};
export default PlayerInfos;