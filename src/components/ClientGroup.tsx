import {RoomJoinRequestPacket, RoomLeavePacket} from "../scripts/network/packets.ts";
import PlayerInfo from "./PlayerInfo.tsx";
import {useMemo, useState} from "preact/hooks";
import {type AudioRoom, PlayerState} from "../scripts/types.ts";
import MinecraftComponent from "./MinecraftComponent.tsx";
import type {FunctionComponent} from "preact";
import {useVoiceStateContext} from "./VoiceStateProvider.tsx";

interface Props {
    room: AudioRoom;
    players: PlayerState[];
}

const ClientGroup: FunctionComponent<Props> = ({room, players}) => {
    const {socket: [socket], user: [user]} = useVoiceStateContext();

    const [password, setPassword] = useState<string>("");
    const hasViewer = useMemo(() => {
        if (user?.uuid) {
            return players.some(state => state.is(user.uuid));
        }
        return false;
    }, [user, players]);

    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            marginTop: "1em",
            gap: "0.2em",
        }}>
            <span>Id: <code>{room.uniqueId.name}</code></span>
            <span>Name: <MinecraftComponent component={room.name}/></span>
            <span>
                Speak Passthrough:
                <code style={{textTransform: "capitalize"}}>{`${room.speakToOthers}`}</code>
            </span>
            <span>
                Listen Passthrough:
                <code style={{textTransform: "capitalize"}}>{`${room.listenToOthers}`}</code>
            </span>
            {players.length > 0 &&
                <>
                    <span style={{marginTop: "0.5em"}}><code>{players.length}</code> Members:</span>
                    <ul>
                        {players.map(state => (
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
            {room.password &&
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
                    onClick={() => socket.sendPacket(new RoomJoinRequestPacket(room.uniqueId, password ? password : null))}
                >
                    Join
                </button>
                <button
                    disabled={!hasViewer}
                    style={{flex: 1}}
                    onClick={() => socket.sendPacket(new RoomLeavePacket(room.uniqueId))}
                >
                    Leave
                </button>
            </div>
        </div>
    );
};
export default ClientGroup;
