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
import Button from "./Button.tsx";
import LockIcon from "~icons/tabler/lock-filled"

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
        <div className={"flex flex-col mt-3 gap-2 p-5 bg-neutral-900 rounded-xl"}>
            <div className={"flex justify-between"}>
                <div className={"flex gap-4 items-center"}>
                    <span className={"text-lg font-semibold"}><MinecraftComponent component={room.name}/></span>
                    <span>PLAYERLIST</span>
                </div>
                <div className={"flex gap-2 items-center"}>
                    <span>GROUPTYPE</span>
                    <span><LockIcon /></span>
                </div>
            </div>
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
                <div className={"flex flex-col items-stretch"}>
                    <input 
                        className={"h-10 w-full p-4 rounded-lg text-sm bg-neutral-900 border border-neutral-700 placeholder:text-neutral-300 focus:outline-2 focus:outline-white"}
                        onChange={event => setPassword(event.currentTarget.value)}
                        type={"password"} disabled={hasViewer} placeholder={"Password"}
                    />
                </div>
            }
            <div className={"flex gap-2"}>
                <Button
                    color={"purple"}
                    disabled={hasViewer || joining || leaving}
                    style={{flex: 1}}
                    onClick={joinRoom}
                >
                    Join
                </Button>
                <Button
                    color={"purple"}
                    disabled={!hasViewer || joining || leaving}
                    style={{flex: 1}}
                    onClick={leaveRoom}
                >
                    Leave
                </Button>
            </div>
        </div>
    );
};
export default ClientGroup;
