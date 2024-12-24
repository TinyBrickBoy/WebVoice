import type {GroupState, PlayerState} from "./VoiceContainer.tsx";
import ClientGroup from "./ClientGroup.tsx";

interface Props {
    players: PlayerState[];
    groups: GroupState[];
}

const ClientGroups = (props: Props) => {
    return (
        <>
            <h2 style={{marginBottom: "0.5em"}}>Groups</h2>
            {props.groups.map(group => (
                <ClientGroup
                    key={group.groupId} {...group}
                    players={props.players.filter(state => !state.disconnected && state.groupId?.name === group.groupId.name)}
                />
            ))}
        </>
    );
};
export default ClientGroups;