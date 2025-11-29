import {
    AudioPacket,
    CategoryAddPacket,
    CategoryRemovePacket,
    ConnectedPacket,
    DecodablePacket,
    InputSoundPacket,
    KeepAlivePacket,
    type Packet,
    PingPacket,
    PositionUpdatePacket,
    RoomAddPacket,
    RoomCreatePacket,
    RoomJoinRequestPacket,
    RoomJoinResponsePacket,
    RoomLeavePacket,
    RoomRemovePacket,
    StateInfoPacket,
    StateRemovePacket,
    StateUpdatePacket,
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

const packetCtors = [
    // clientbound
    AudioPacket,
    CategoryAddPacket,
    CategoryRemovePacket,
    ConnectedPacket,
    PositionUpdatePacket,
    RoomAddPacket,
    RoomJoinResponsePacket,
    RoomRemovePacket,
    StateRemovePacket,
    StateUpdatePacket,
    // commonbound
    KeepAlivePacket,
    PingPacket,
    // servicebound
    InputSoundPacket,
    RoomCreatePacket,
    RoomJoinRequestPacket,
    RoomLeavePacket,
    StateInfoPacket,
] as (PacketConstructor | DecodablePacketConstructor)[];

// save packet id in packet constructor to use when writing the packet
packetCtors.forEach((ctor, index) => ctor.packetId = index);

export const readPacket = (buf: ByteBuffer) => {
    const packetId = readVarInt(buf);
    const entry = packetCtors[packetId];
    if (!entry) {
        throw new Error("Failed to find packet with id " + packetId + " in registry");
    }
    // ensure its a decodable packet
    if (entry.prototype instanceof DecodablePacket) {
        return new entry(buf);
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
