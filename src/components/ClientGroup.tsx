import type {UUID} from "../scripts/uuid.ts";
import type {JoinGroupPacket, LeaveGroupPacket, PacketClientGroupType} from "../scripts/packets.ts";
import type {PlayerState} from "./VoiceContainer.tsx";
import PlayerInfo from "./PlayerInfo.tsx";
import {useMemo} from "preact/hooks";

interface Props {
    groupId: UUID;
    name: String;
    type: PacketClientGroupType;

    viewerId?: UUID;
    players: PlayerState[];

    joinGroup: (packet: JoinGroupPacket) => void,
    leaveGroup: (packet: LeaveGroupPacket) => void,
}

const ClientGroup = (props: Props) => {
    const viewerMember = useMemo(() => {
        if (props.viewerId) {
            const viewerIdStr = props.viewerId.name;
            const idx = props.players.findIndex(state => state.playerId.name === viewerIdStr);
            return idx >= 0;
        }
        return false;
    }, [props.viewerId, props.players]);

    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            marginTop: "1em",
            gap: "0.2em",
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
            <div style={{display: "flex", flexDirection: "row", gap: "0.5em", marginTop: "0.5em"}}>
                <button
                    disabled={viewerMember}
                    style={{flex: 1}}
                    onClick={() => props.joinGroup({groupId: props.groupId})}
                >
                    Join
                </button>
                <button
                    disabled={!viewerMember}
                    style={{flex: 1}}
                    onClick={() => props.leaveGroup({})}
                >
                    Leave
                </button>
            </div>
        </div>
    );
};
export default ClientGroup;