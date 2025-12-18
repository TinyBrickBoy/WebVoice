import RoomInfo from "./RoomInfo.tsx";
import {RoomAddPacket, RoomRemovePacket} from "../../scripts/network/packets.ts";
import type {FunctionComponent} from "preact";
import {useEffect, useMemo, useState} from "preact/hooks";
import {useVoiceStateContext} from "../VoiceStateProvider.tsx";
import {includesTextLc} from "../../scripts/network/component.ts";
import Button from "../common/Button.tsx";
import RoomCreateModal from "./RoomCreateModal.tsx";
import {RoomState} from "../../scripts/types.ts";
import {uuidFromString} from "../../scripts/util/uuid.ts";

interface Props {
    search: string;
}

const RoomList: FunctionComponent<Props> = ({search}) => {
    const {
        socket,
        state: [state],
        players: [players],
        rooms: [rooms, setRooms],
        user: [{uuid}],
    } = useVoiceStateContext();
    const [creatingGroup, setCreatingGroup] = useState<boolean>(false);

    useEffect(() => {
        if (state !== "connected") {
            setRooms({
                "d87dd345-5b9b-492a-be3d-eeafe70362b0": new RoomState(
                    uuidFromString("d87dd345-5b9b-492a-be3d-eeafe70362b0"),
                    "Testing Room",
                    true, true,
                    true, true,
                ),
                "f2d0a0e9-937f-418c-b9b2-8bf690a1aa16": new RoomState(
                    uuidFromString("f2d0a0e9-937f-418c-b9b2-8bf690a1aa16"),
                    "Testing Room",
                    true, true,
                    true, true,
                ),
                "c645f5a1-18c3-44de-b7e7-2313af589ed7": new RoomState(
                    uuidFromString("c645f5a1-18c3-44de-b7e7-2313af589ed7"),
                    "Testing Room",
                    true, true,
                    true, true,
                ),
                "d95ac678-1d54-482c-94e1-eaafbbf909f7": new RoomState(
                    uuidFromString("d95ac678-1d54-482c-94e1-eaafbbf909f7"),
                    "Testing Room",
                    true, true,
                    true, true,
                ),
                "7be38518-0267-427e-a91d-f3a7e6901ac9": new RoomState(
                    uuidFromString("7be38518-0267-427e-a91d-f3a7e6901ac9"),
                    "Testing Room",
                    true, true,
                    true, true,
                ),
            });
            setCreatingGroup(false);
        }
    }, [state === "connected"]);

    useEffect(() => {
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
                    <RoomInfo key={room.uniqueId.name} room={room}/>
                ))}</div>
        </details>
    </>;
};
export default RoomList;
