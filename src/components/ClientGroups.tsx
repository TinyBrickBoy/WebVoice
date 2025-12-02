import ClientGroup from "./ClientGroup.tsx";
import type {UUID} from "../scripts/util/uuid.ts";
import {Packet, RoomAddPacket, RoomRemovePacket} from "../scripts/network/packets.ts";
import type {AudioRoom, PlayerState} from "../scripts/types.ts";
import type {FunctionComponent} from "preact";
import {useEffect, useState} from "preact/hooks";
import type {VoiceSocket} from "../scripts/socket.ts";

interface Props {
    socket: VoiceSocket;
    viewerId?: UUID;
    players: PlayerState[];
    sendPacket: (packet: Packet) => void,
}

const ClientGroups: FunctionComponent<Props> = ({socket, viewerId, players, sendPacket}) => {
    const [rooms, setRooms] = useState<Record<string, AudioRoom>>({});

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
                        key={room.uniqueId.name} room={room}
                        viewerId={viewerId}
                        players={players.filter(state => state.in(room.uniqueId))}
                        sendPacket={sendPacket}
                    />
                ))}
        </div> : <></>;
};
export default ClientGroups;
