import RoomInfo from "./RoomInfo.tsx";
import {RoomAddPacket, RoomRemovePacket} from "../../scripts/network/packets.ts";
import type {FunctionComponent} from "preact";
import {useEffect, useState} from "preact/hooks";
import {useVoiceStateContext} from "../VoiceStateProvider.tsx";
import {RoomState} from "../../scripts/types.ts";
import {randomUUID} from "../../scripts/util/uuid.ts";
import {includesTextLc} from "../../scripts/network/component.ts";
import Button from "../common/Button.tsx";
import RoomCreateModal from "./RoomCreateModal.tsx";

interface Props {
    search: string;
}

const RoomList: FunctionComponent<Props> = ({search}) => {
    const {socket: [socket], players: [players], rooms: [rooms, setRooms]} = useVoiceStateContext();

    useEffect(() => {
        setRooms({}); // invalidate

        // TODO remove debug
        const drooms = {} as Record<string, RoomState>;
        for (let i = 0; i < 16; i++) {
            const uuid = randomUUID();
            drooms[uuid.name] = new RoomState(uuid, `Group ${i + 1}`, i % 2 == 0, true, false, false);
        }
        setRooms(drooms);

        // register events
        return socket.registers()
            .register("open", () => setRooms({})) // TODO remove debug
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

    const [creatingGroup, setCreatingGroup] = useState<boolean>(false);

    let roomValues = Object.values(rooms)
        .filter(room => room.joinable);
    if (search) {
        roomValues = roomValues.filter(room =>
            includesTextLc(room.name, search)
            || room.uniqueId.name.includes(search));
    }
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
