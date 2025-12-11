import ClientGroup from "./ClientGroup.tsx";
import {RoomAddPacket, RoomRemovePacket} from "../scripts/network/packets.ts";
import type {FunctionComponent} from "preact";
import {useEffect} from "preact/hooks";
import {useVoiceStateContext} from "./VoiceStateProvider.tsx";
import {AudioRoom} from "../scripts/types.ts";
import {randomUUID} from "../scripts/util/uuid.ts";
import {includesTextLc} from "../scripts/network/component.ts";

interface Props {
    search: string;
}

const ClientGroups: FunctionComponent<Props> = ({search}) => {
    const {socket: [socket], players: [players], rooms: [rooms, setRooms]} = useVoiceStateContext();

    useEffect(() => {
        setRooms({}); // invalidate

        // TODO remove debug
        const drooms = {} as Record<string, AudioRoom>;
        for (let i = 0; i < 16; i++) {
            const uuid = randomUUID();
            drooms[uuid.name] = new AudioRoom(uuid, `Group ${i + 1}`, i % 2 == 0, true, false, false);
        }
        setRooms(drooms);

        // register events
        return socket.registers()
            .register("open", () => setRooms({})) // TODO remove debug
            .register("room_add", ({detail: {room}}: CustomEvent<RoomAddPacket>) => {
                setRooms(rooms => {
                    // keep volume and copy rooms record
                    room.volume = rooms[room.uniqueId.name]?.volume || 1;
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

    let roomValues = Object.values(rooms)
        .filter(room => room.joinable);
    if (search) {
        roomValues = roomValues.filter(room =>
            includesTextLc(room.name, search)
            || room.uniqueId.name.includes(search));
    }
    return <>
        <details open={true}>
            <summary className={"text-sm text-neutral-400"}>Groups ({roomValues.length})</summary>
            <div className={"flex flex-col"}>
                {roomValues.map(room => (
                    <ClientGroup
                        key={room.uniqueId.name}
                        room={room}
                        players={Object.values(players).filter(state => state.in(room.uniqueId))}
                    />
                ))}
            </div>
        </details>
    </>;
};
export default ClientGroups;
