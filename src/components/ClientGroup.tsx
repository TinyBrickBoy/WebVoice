import type {UUID} from "../scripts/util/uuid.ts";
import {RoomJoinRequestPacket, RoomLeavePacket} from "../scripts/network/packets.ts";
import PlayerInfo from "./PlayerInfo.tsx";
import {useMemo, useState} from "preact/hooks";
import {type AudioRoom, PlayerState, type SendPacket} from "../scripts/types.ts";
import MinecraftComponent from "./MinecraftComponent.tsx";

interface Props {
    room: AudioRoom;
    viewerId?: UUID;
    players: PlayerState[];
    sendPacket: SendPacket,
}

const ClientGroup = (props: Props) => {
    const [password, setPassword] = useState<string>("");
    const hasViewer = useMemo(() => {
        if (props.viewerId) {
            return props.players.some(state => state.is(props.viewerId!!));
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
            <span>Id: <code>{props.room.uniqueId.name}</code></span>
            <span>Name: <MinecraftComponent component={props.room.name}/></span>
            <span>
                Speak Passthrough:
                <code style={{textTransform: "capitalize"}}>{`${props.room.speakToOthers}`}</code>
            </span>
            <span>
                Listen Passthrough:
                <code style={{textTransform: "capitalize"}}>{`${props.room.listenToOthers}`}</code>
            </span>
            {props.players.length > 0 &&
                <>
                    <span style={{marginTop: "0.5em"}}><code>{props.players.length}</code> Members:</span>
                    <ul>
                        {props.players.map(state => (
                            <li style={{listStyleType: "none"}} key={state.uniqueId.name}>
                                <div style={{
                                    display: "flex",
                                    gap: "0.5em",
                                    flexDirection: "row",
                                    alignItems: "center",
                                }}>
                                    <span>•</span>
                                    <PlayerInfo state={state} inline/>
                                </div>
                            </li>
                        ))}
                    </ul>
                </>
            }
            {props.room.password &&
                <div style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "stretch",
                }}>
                    <input
                        onChange={event => setPassword(event.currentTarget.value)}
                        type={"password"} disabled={hasViewer} placeholder="Password"
                    />
                </div>
            }
            <div style={{
                display: "flex",
                flexDirection: "row",
                gap: "0.5em",
                marginTop: "0.5em",
            }}>
                <button
                    disabled={hasViewer}
                    style={{flex: 1}}
                    onClick={() => props.sendPacket(new RoomJoinRequestPacket(props.room.uniqueId, password ? password : null))}
                >
                    Join
                </button>
                <button
                    disabled={!hasViewer}
                    style={{flex: 1}}
                    onClick={() => props.sendPacket(new RoomLeavePacket(props.room.uniqueId))}
                >
                    Leave
                </button>
            </div>
        </div>
    );
};
export default ClientGroup;
