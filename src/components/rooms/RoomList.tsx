import RoomInfo from "./RoomInfo.tsx";
import {RoomAddPacket, RoomRemovePacket} from "../../scripts/network/packets.ts";
import type {FunctionComponent} from "preact";
import {useEffect, useMemo, useState} from "preact/hooks";
import {useVoiceStateContext} from "../VoiceStateProvider.tsx";
import {includesTextLc} from "../../scripts/network/component.ts";
import Button from "../common/Button.tsx";
import RoomCreateModal from "./RoomCreateModal.tsx";

interface Props {
    search: string;
}

const RoomList: FunctionComponent<Props> = ({search}) => {
    const {socket: [socket], players: [players], rooms: [rooms, setRooms], user: [{uuid}]} = useVoiceStateContext();
    const [creatingGroup, setCreatingGroup] = useState<boolean>(false);

    useEffect(() => {
        if (!socket.isActive()) {
            setRooms({});
        }
        return socket.registers()
            .register("open", () => setRooms({}))
            .register("room_add", ({detail: {room}}: CustomEvent<RoomAddPacket>) => {
                setRooms(rooms => {
                    return {...rooms, [room.uniqueId.name]: room};
                });
            })
            .register("room_remove", ({detail: {roomId}}: CustomEvent<RoomRemovePacket>) => {
                setRooms(rooms => {
                    const newRooms = {...rooms};
                    delete newRooms[roomId.name];
                    return newRooms;
                });
            })
            .callback();
    }, [socket]);

    const userRoomId = useMemo(() =>
        players[uuid.name]?.primaryRoomId || null, [uuid, players]);

    const roomValues = useMemo(() => {
        let list = Object.values(rooms)
            .filter(room => room.joinable);
        if (search) {
            list = list.filter(room =>
                includesTextLc(room.name, search)
                || room.uniqueId.name.includes(search));
        }
        // move the user's room to the top of the list
        list.sort((r1, r2) => {
            if (userRoomId) {
                if (r1.uniqueId.name === userRoomId.name) {
                    return -1;
                } else if (r2.uniqueId.name === userRoomId.name) {
                    return 1;
                }
            }
            return 0;
        });
        return list;
    }, [rooms, search, userRoomId]);

    return <>
        <RoomCreateModal visible={[creatingGroup, setCreatingGroup]}/>
        <details open={true}>
            <summary className={"text-sm text-neutral-400 cursor-pointer select-none"}>
                Groups ({roomValues.length})
            </summary>
            <div className={"flex flex-col gap-3 m-2 mb-0"}>
                <Button
                    color={"purple"}
                    disabled={creatingGroup}
                    onClick={() => setCreatingGroup(true)}
                >
                    Create Group
                </Button>
                {roomValues.map(room => (
                    <RoomInfo
                        key={room.uniqueId.name}
                        room={room}
                        players={Object.values(players).filter(state => state.in(room.uniqueId))}
                    />
                ))}</div>
        </details>
    </>;
};
export default RoomList;
