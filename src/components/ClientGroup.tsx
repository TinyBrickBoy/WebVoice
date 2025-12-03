import {
    RoomJoinRequestPacket,
    RoomJoinResponsePacket,
    RoomLeavePacket,
    RoomLeaveResponsePacket,
} from "../scripts/network/packets.ts";
import PlayerInfo from "./PlayerInfo.tsx";
import {useCallback, useEffect, useMemo, useState} from "preact/hooks";
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
    const [joining, setJoining] = useState<boolean>(false);
    const [leaving, setLeaving] = useState<boolean>(false);
    const [joinFailed, setJoinFailed] = useState<boolean>(false);

    const hasViewer = useMemo(() => {
        if (user?.uuid) {
            return players.some(state => state.is(user.uuid));
        }
        return false;
    }, [user, players]);

    useEffect(() => {
        return socket.registers()
            .register("room_join_response", ({detail: {roomId, success}}: CustomEvent<RoomJoinResponsePacket>) => {
                if (room.uniqueId.name === roomId.name) {
                    setJoinFailed(!success);
                    setJoining(false);
                }
            })
            .register("room_leave_response", ({detail: {roomId}}: CustomEvent<RoomLeaveResponsePacket>) => {
                if (room.uniqueId.name === roomId.name) {
                    setLeaving(false);
                }
            })
            .callback();
    }, [socket]);

    const joinRoom = useCallback(() => {
        setJoining(true);
        setJoinFailed(false);
        socket.sendPacket(new RoomJoinRequestPacket(room.uniqueId, password ? password : null));
    }, [socket, password]);

    const leaveRoom = useCallback(() => {
        setLeaving(true);
        socket.sendPacket(new RoomLeavePacket(room.uniqueId));
    }, [socket, password]);

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
            {joinFailed && <span>Failed to join!</span>}
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
                    disabled={hasViewer || joining || leaving}
                    style={{flex: 1}}
                    onClick={joinRoom}
                >
                    Join
                </button>
                <button
                    disabled={!hasViewer || joining || leaving}
                    style={{flex: 1}}
                    onClick={leaveRoom}
                >
                    Leave
                </button>
            </div>
        </div>
    );
};
export default ClientGroup;
