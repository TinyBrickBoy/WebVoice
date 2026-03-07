import {
    CategoryAddPacket,
    CategoryRemovePacket,
    ConnectedPacket,
    DecodablePacket,
    KeepAlivePacket,
    type Packet,
    PingPacket,
    RoomAddPacket,
    RoomCreatePacket,
    RoomJoinRequestPacket,
    RoomJoinResponsePacket,
    RoomLeavePacket,
    RoomLeaveResponsePacket,
    RoomRemovePacket,
    RtcOfferPacket,
    RtcIceCandidatePacket,
    StateInfoPacket,
    StateRemovePacket,
    StateUpdatePacket,
    VoiceActivityPacket,
    VolumePacket,
    RtcConnectPacket,
} from "./packets.ts";
import ByteBuffer from "bytebuffer";
import {readVarInt, writeVarInt} from "./buffer.ts";

interface PacketConstructor {
    packetId: number;

    new(...any: any[]): Packet;
}

interface DecodablePacketConstructor extends PacketConstructor {
    new(buf: ByteBuffer): DecodablePacket;
}

type EncodablePacket = {
    encode: (buf: ByteBuffer) => void
}

type PacketEntry = [string, PacketConstructor | DecodablePacketConstructor]

const packetCtors = [
    // clientbound
    ["category_add", CategoryAddPacket],
    ["category_remove", CategoryRemovePacket],
    ["connected", ConnectedPacket],
    ["room_add", RoomAddPacket],
    ["room_join_response", RoomJoinResponsePacket],
    ["room_leave_response", RoomLeaveResponsePacket],
    ["room_remove", RoomRemovePacket],
    ["state_remove", StateRemovePacket],
    ["state_update", StateUpdatePacket],
    ["voice_activity", VoiceActivityPacket],
    ["rtc_connect", RtcConnectPacket],
    // commonbound
    ["keep_alive", KeepAlivePacket],
    ["ping", PingPacket],
    ["rtc_offer", RtcOfferPacket],
    ["rtc_ice_candidate", RtcIceCandidatePacket],
    // servicebound
    ["room_create", RoomCreatePacket],
    ["room_join_request", RoomJoinRequestPacket],
    ["room_leave", RoomLeavePacket],
    ["state_info", StateInfoPacket],
    ["volume", VolumePacket],
] as PacketEntry[];

// save packet id in packet constructor to use when writing the packet
packetCtors.forEach(([_, ctor], index) => ctor.packetId = index);

export const readPacket = (buf: ByteBuffer) => {
    const packetId = readVarInt(buf);
    const [id, ctor] = packetCtors[packetId];
    if (!id || !ctor) {
        throw new Error("Failed to find packet with id " + packetId + " in registry");
    }
    // ensure its a decodable packet
    if (ctor.prototype instanceof DecodablePacket) {
        return {id, packet: new ctor(buf)};
    }
    throw new Error("Packet with id " + packetId + " is not decodable");
};

export const writePacket = (buf: ByteBuffer, packet: Packet) => {
    if ("packetId" in packet.constructor) {
        const packetId = (packet.constructor as PacketConstructor).packetId;
        writeVarInt(buf, packetId);
    } else {
        throw new Error("Packet " + packet + " has no packet id set");
    }
    if ("encode" in packet) {
        (packet as EncodablePacket).encode(buf);
    } else {
        throw new Error("Packet " + packet + " is not encodable");
    }
};
