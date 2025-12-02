import ClientGroup from "./ClientGroup.tsx";
import type {UUID} from "../scripts/util/uuid.ts";
import {Packet} from "../scripts/network/packets.ts";
import type {AudioRoom, PlayerState} from "../scripts/types.ts";

interface Props {
    viewerId?: UUID;
    players: PlayerState[];
    rooms: AudioRoom[];
    sendPacket: (packet: Packet) => void,
}

const ClientGroups = (props: Props) => {
    return (
        <>
            <h2 style={{marginBottom: "0.5em"}}>Groups</h2>
            {props.rooms
                .filter(room => room.joinable)
                .map(room => (
                    <ClientGroup
                        key={room.uniqueId.name} room={room}
                        viewerId={props.viewerId}
                        players={props.players.filter(state => state.in(room.uniqueId))}
                        sendPacket={props.sendPacket}
                    />
                ))}
        </>
    );
};
export default ClientGroups;
