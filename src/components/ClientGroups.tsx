import type {GroupState} from "./VoiceContainer.tsx";
import ClientGroup from "./ClientGroup.tsx";

interface Props {
    groups: GroupState[];
}

const ClientGroups = (props: Props) => {
    return (
        <>
            <h2 style={{marginBottom: "0.5em"}}>Groups</h2>
            {props.groups.map(group => (
                <ClientGroup key={group.groupId} {...group}/>
            ))}
        </>
    );
};
export default ClientGroups;