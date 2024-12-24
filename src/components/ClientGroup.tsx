import type {UUID} from "../scripts/uuid.ts";
import type {PacketClientGroupType} from "../scripts/packets.ts";
import type {PlayerState} from "./VoiceContainer.tsx";
import PlayerInfo from "./PlayerInfo.tsx";

interface Props {
    groupId: UUID;
    name: String;
    type: PacketClientGroupType;
    players: PlayerState[];
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
            {props.players.length > 0 &&
                <>
                    <span style={{marginTop: "0.5em"}}><code>{props.players.length}</code> Members:</span>
                    <ul>
                        {props.players.map(state => (
                            <li style={{listStyleType: "none"}} key={state.playerId}>
                                <div style={{
                                    display: "flex",
                                    gap: "0.5em",
                                    flexDirection: "row",
                                    alignItems: "center",
                                }}>
                                    <span>•</span>
                                    <PlayerInfo inline {...state}/>
                                </div>
                            </li>
                        ))}
                    </ul>
                </>
            }
        </div>
    );
};
export default ClientGroup;