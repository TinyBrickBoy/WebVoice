import ClientGroup from "./ClientGroup.tsx";
import {RoomAddPacket, RoomRemovePacket} from "../scripts/network/packets.ts";
import type {FunctionComponent} from "preact";
import {useEffect} from "preact/hooks";
import {useVoiceStateContext} from "./VoiceStateProvider.tsx";

const ClientGroups: FunctionComponent = () => {
    const {socket: [socket], players: [players], rooms: [rooms, setRooms]} = useVoiceStateContext();

    useEffect(() => {
        setRooms({}); // invalidate

        // register events
        return socket.registers()
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

    return Object.values(rooms).length ?
        <div className={"container"}>
            <h2 style={{marginBottom: "0.5em"}}>Groups</h2>
            {Object.values(rooms)
                .filter(room => room.joinable)
                .map(room => (
                    <ClientGroup
                        key={room.uniqueId.name}
                        room={room}
                        players={Object.values(players).filter(state => state.in(room.uniqueId))}
                    />
                ))}
        </div> : <></>;
};
export default ClientGroups;
