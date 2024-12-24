import type {GroupState, PlayerState} from "./VoiceContainer.tsx";
import ClientGroup from "./ClientGroup.tsx";
import type {UUID} from "../scripts/uuid.ts";
import type {JoinGroupPacket, LeaveGroupPacket} from "../scripts/packets.ts";

interface Props {
    viewerId?: UUID;
    players: PlayerState[];
    groups: GroupState[];

    joinGroup: (packet: JoinGroupPacket) => void,
    leaveGroup: (packet: LeaveGroupPacket) => void,
}

const ClientGroups = (props: Props) => {
    return (
        <>
            <h2 style={{marginBottom: "0.5em"}}>Groups</h2>
            {props.groups.map(group => (
                <ClientGroup
                    key={group.groupId} viewerId={props.viewerId} {...group}
                    players={props.players.filter(state => !state.disconnected && state.groupId?.name === group.groupId.name)}
                    joinGroup={props.joinGroup} leaveGroup={props.leaveGroup}
                />
            ))}
        </>
    );
};
export default ClientGroups;