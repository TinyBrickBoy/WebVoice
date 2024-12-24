import type {UUID} from "../scripts/uuid.ts";
import type {PacketClientGroupType} from "../scripts/packets.ts";

interface Props {
    groupId: UUID;
    name: String;
    type: PacketClientGroupType;
}

const ClientGroup = (props: Props) => {
    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            marginTop: "1em",
        }}>
            <span>Id: <code>{props.groupId.name}</code></span>
            <span>Name: <code>{props.name}</code></span>
            <span>Type: <code style={{textTransform: "capitalize"}}>{props.type}</code></span>
        </div>
    );
};
export default ClientGroup;