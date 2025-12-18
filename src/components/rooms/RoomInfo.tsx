import {
    RoomJoinRequestPacket,
    RoomJoinResponsePacket,
    RoomLeavePacket,
    RoomLeaveResponsePacket,
} from "../../scripts/network/packets.ts";
import PlayerInfo from "../players/PlayerInfo.tsx";
import {useCallback, useEffect, useMemo, useState} from "preact/hooks";
import {type RoomState} from "../../scripts/types.ts";
import MinecraftComponent from "../common/MinecraftComponent.tsx";
import type {FunctionComponent} from "preact";
import {useVoiceStateContext} from "../VoiceStateProvider.tsx";
import Button from "../common/Button.tsx";
import LockIcon from "~icons/tabler/lock-filled";
import Input from "../common/Input.tsx";
import TextBox from "../common/TextBox.tsx";

export type GroupAudioType = "normal" | "open" | "isolated";
type State = "outside" | "inside" | "entering" | "entering failed" | "exiting" | "exiting failed";

interface Props {
    room: RoomState;
}

const RoomInfo: FunctionComponent<Props> = ({room}) => {
    const {socket: [socket], user: [user], players: [players]} = useVoiceStateContext();

    const [password, setPassword] = useState<string>("");
    const [state, setState] = useState<State>("outside");

    const members = useMemo(() => {
        return Object.values(players)
            .filter(player => player.in(room.uniqueId));
    }, [room.uniqueId, players]);

    const hasUser = useMemo(() => {
        return members.some(member => member.is(user.uuid));
    }, [user, members]);
    useEffect(() => {
        setState(hasUser ? "inside" : "outside");
        setPassword("");
    }, [hasUser]);

    useEffect(() => {
        return socket.registers()
            .register("room_join_response", ({detail: {roomId, success}}: CustomEvent<RoomJoinResponsePacket>) => {
                console.log("rjs", roomId, success);
                if (room.uniqueId.name === roomId.name) {
                    setState(success ? "inside" : "entering failed");
                }
            })
            .register("room_leave_response", ({detail: {roomId, success}}: CustomEvent<RoomLeaveResponsePacket>) => {
                console.log("rlr", roomId, success);
                if (room.uniqueId.name === roomId.name) {
                    setState(success ? "outside" : "exiting failed");
                }
            })
            .callback();
    }, [socket]);

    const joinRoom = useCallback(() => {
        setState("entering");
        socket.sendPacket(new RoomJoinRequestPacket(room.uniqueId, password ? password : null));
    }, [socket, password]);

    const leaveRoom = useCallback(() => {
        setState("exiting");
        socket.sendPacket(new RoomLeavePacket(room.uniqueId));
    }, [socket, password]);

    const roomAudioType = useMemo(() => {
        if (room.listenToOthers && room.speakToOthers) {
            return "open";
        } else if (!room.listenToOthers) {
            return "isolated";
        } else {
            return "normal";
        }
    }, [room.listenToOthers, room.speakToOthers]);

    return (
        <form
            className={`flex flex-col gap-2 p-5 bg-neutral-900 border-2 rounded-2xl ${state == "entering" ? "border-orange-300" : state === "inside" ? "border-green-300" : "border-neutral-800"}`}>
            <div className={"flex flex-col gap-1"}>
                <div className={"flex flex-row gap-3 items-center"}>
                    <div className={"flex flex-row items-center gap-1"}>
                        <MinecraftComponent className={"text-lg font-medium"} component={room.name}/>
                        {room.password && <LockIcon/>}
                    </div>
                </div>
                <div class={"flex text-sm gap-2 text-neutral-300 uppercase"}>
                    <span>
                        {roomAudioType}
                    </span>
                    <span>
                        {members.length} member{members.length === 1 ? "" : "s"}
                    </span>
                </div>
            </div>
            <div className={"flex flex-col gap-2"}>
                {members.map(member => <PlayerInfo state={member}/>)}
            </div>
            {(room.password && !hasUser) &&
                <Input label={<>Password for group</>}>
                    <TextBox
                        value={password} required type={"password"}
                        placeholder={"Enter password for group"}
                        disabled={state !== "outside" && state !== "entering failed"}
                        onChange={val => setPassword(val.trim())}
                    />
                </Input>
            }
            <div className={"flex flex-row gap-2"}>
                <Button
                    color={"purple"}
                    disabled={state !== "outside" && state !== "entering failed" || (room.password && password.length < 1)}
                    className={"grow"}
                    onClick={joinRoom}
                    type={"submit"}
                >
                    Join
                </Button>
                <Button
                    color={"purple"}
                    disabled={state !== "inside" && state !== "exiting failed"}
                    className={"grow"}
                    onClick={leaveRoom}
                >
                    Leave
                </Button>
            </div>
        </form>
    );
};
export default RoomInfo;
