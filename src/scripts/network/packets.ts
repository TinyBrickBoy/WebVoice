import type {UUID} from "../util/uuid.ts";
import Long from "long";
import {CategoryState, PlayerState, RoomState} from "../types.ts";
import ByteBuffer from "bytebuffer";
import {
    readBoolean,
    readComponentJson,
    readOptional,
    readString,
    readUniqueId,
    readVarInt,
    readVarLong,
    writeBoolean,
    writeOptional,
    writeString,
    writeUniqueId,
    writeVarInt,
    writeVarLong,
} from "./buffer.ts";
import type {Component} from "./component.ts";

export abstract class Packet {
    public static packetId = 0;
}

export abstract class DecodablePacket extends Packet {
    protected constructor() {
        super();
    }
}

// clientbound

export class CategoryAddPacket extends DecodablePacket {

    public readonly category: CategoryState;

    constructor(buf: ByteBuffer) {
        super();
        this.category = new CategoryState(buf);
    }
}

export class CategoryRemovePacket extends DecodablePacket {

    public readonly categoryId: UUID;

    constructor(buf: ByteBuffer) {
        super();
        this.categoryId = readUniqueId(buf);
    }
}

export class ConnectedPacket extends DecodablePacket {

    public readonly playerId: UUID;
    public readonly username: Component;
    public readonly serverId: UUID | null;
    public readonly serverName: Component | null;
    public readonly serverType: string | null;

    constructor(buf: ByteBuffer) {
        super();
        this.playerId = readUniqueId(buf);
        this.username = readComponentJson(buf);
        if (readBoolean(buf)) {
            this.serverId = readUniqueId(buf);
            this.serverName = readBoolean(buf) ? readComponentJson(buf) : null;
            this.serverType = readBoolean(buf) ? readString(buf) : null;
        } else {
            this.serverId = null;
            this.serverName = null;
            this.serverType = null;
        }
    }
}

export class RoomAddPacket extends DecodablePacket {

    public readonly room: RoomState;

    constructor(buf: ByteBuffer) {
        super();
        this.room = new RoomState(buf);
    }
}

export class RoomJoinResponsePacket extends DecodablePacket {

    public readonly roomId: UUID;
    public readonly success: boolean;

    constructor(buf: ByteBuffer) {
        super();
        this.roomId = readUniqueId(buf);
        this.success = readBoolean(buf);
    }
}

export class RoomLeaveResponsePacket extends DecodablePacket {

    public readonly roomId: UUID;
    public readonly success: boolean;

    constructor(buf: ByteBuffer) {
        super();
        this.roomId = readUniqueId(buf);
        this.success = readBoolean(buf);
    }
}

export class RoomRemovePacket extends DecodablePacket {

    public readonly roomId: UUID;

    constructor(buf: ByteBuffer) {
        super();
        this.roomId = readUniqueId(buf);
    }
}

export class StateRemovePacket extends DecodablePacket {

    public readonly playerId: UUID;

    constructor(buf: ByteBuffer) {
        super();
        this.playerId = readUniqueId(buf);
    }
}

export class StateUpdatePacket extends DecodablePacket {

    public readonly state: PlayerState;

    constructor(buf: ByteBuffer) {
        super();
        this.state = new PlayerState(buf);
    }
}

export class RtcAnswerPacket extends DecodablePacket {

    public readonly type: string;
    public readonly sdp: string | null;

    constructor(buf: ByteBuffer) {
        super();
        this.type = readString(buf);
        this.sdp = readOptional(buf, () => readString(buf));
    }
}

export class RtcRemoteIceCandidateInitPacket extends DecodablePacket {

    public readonly candidate: string | null;
    public readonly sdpMid: string | null;
    public readonly sdpMLineIndex: number | null;
    public readonly usernameFragment: string | null;

    constructor(buf: ByteBuffer) {
        super();
        this.candidate = readOptional(buf, () => readString(buf));
        this.sdpMid = readOptional(buf, () => readString(buf));
        this.sdpMLineIndex = readOptional(buf, () => readVarInt(buf));
        this.usernameFragment = readOptional(buf, () => readString(buf));
    }
}

export class RemoteVoiceActivityPacket extends DecodablePacket {

    public readonly playerId: UUID;
    public readonly active: boolean;

    constructor(buf: ByteBuffer) {
        super();
        this.playerId = readUniqueId(buf);
        this.active = readBoolean(buf);
    }
}

// commonbound

export class KeepAlivePacket extends DecodablePacket {

    public readonly id: Long;

    constructor(id: Long);
    constructor(buf: ByteBuffer);
    constructor(param: ByteBuffer | Long) {
        super();
        this.id = "readByte" in param ? readVarLong(param) : param;
    }

    public encode(buf: ByteBuffer): void {
        writeVarLong(buf, this.id);
    }
}

export class PingPacket extends DecodablePacket {

    public readonly id: Long;

    constructor(id: Long);
    constructor(buf: ByteBuffer);
    constructor(param: ByteBuffer | Long) {
        super();
        this.id = "readByte" in param ? readVarLong(param) : param;
    }

    public encode(buf: ByteBuffer): void {
        writeVarLong(buf, this.id);
    }
}

// servicebound

export class RoomCreatePacket extends Packet {

    public readonly name: string;
    public readonly password: string | null;
    public readonly speakToOthers: boolean;
    public readonly listenToOthers: boolean;

    constructor(name: string, password: string | null, speakToOthers: boolean, listenToOthers: boolean) {
        super();
        this.name = name;
        this.password = password;
        this.speakToOthers = speakToOthers;
        this.listenToOthers = listenToOthers;
    }

    public encode(buf: ByteBuffer): void {
        writeString(buf, this.name);
        if (this.password !== null) {
            writeBoolean(buf, true);
            writeString(buf, this.password);
        } else {
            writeBoolean(buf, false);
        }
        writeBoolean(buf, this.speakToOthers);
        writeBoolean(buf, this.listenToOthers);
    }
}

export class RoomJoinRequestPacket extends Packet {

    public readonly roomId: UUID;
    public readonly password: string | null;

    constructor(roomId: UUID, password: string | null) {
        super();
        this.roomId = roomId;
        this.password = password;
    }

    public encode(buf: ByteBuffer): void {
        writeUniqueId(buf, this.roomId);
        if (this.password != null) {
            writeBoolean(buf, true);
            writeString(buf, this.password);
        } else {
            writeBoolean(buf, false);
        }
    }
}

export class RoomLeavePacket extends Packet {

    public readonly roomId: UUID;

    constructor(roomId: UUID) {
        super();
        this.roomId = roomId;
    }

    public encode(buf: ByteBuffer): void {
        writeUniqueId(buf, this.roomId);
    }
}

export class StateInfoPacket extends Packet {

    public readonly muted: boolean;
    public readonly deafened: boolean;

    constructor(muted: boolean, deafened: boolean) {
        super();
        this.muted = muted;
        this.deafened = deafened;
    }

    public encode(buf: ByteBuffer): void {
        writeBoolean(buf, this.muted);
        writeBoolean(buf, this.deafened);
    }
}

export class PacketRtcIceCandidate {

    public readonly address: string | null;
    public readonly candidate: string;
    public readonly component: string | null;
    public readonly foundation: string | null;
    public readonly port: number | null;
    public readonly priority: number | null;
    public readonly protocol: string | null;
    public readonly relatedAddress: string | null;
    public readonly relatedPort: number | null;
    public readonly sdpMid: string | null;
    public readonly sdpMLineIndex: number | null;
    public readonly tcpType: string | null;
    public readonly type: string | null;
    public readonly usernameFragment: string | null;

    constructor(candidate: RTCIceCandidate) {
        this.address = candidate.address;
        this.candidate = candidate.candidate;
        this.component = candidate.component;
        this.foundation = candidate.foundation;
        this.port = candidate.port;
        this.priority = candidate.priority;
        this.protocol = candidate.protocol;
        this.relatedAddress = candidate.relatedAddress;
        this.relatedPort = candidate.relatedPort;
        this.sdpMid = candidate.sdpMid;
        this.sdpMLineIndex = candidate.sdpMLineIndex;
        this.tcpType = candidate.tcpType;
        this.type = candidate.type;
        this.usernameFragment = candidate.usernameFragment;
    }

    public encode(buf: ByteBuffer): void {
        writeOptional(buf, this.address, val => writeString(buf, val));
        writeString(buf, this.candidate);
        writeOptional(buf, this.component, val => writeString(buf, val));
        writeOptional(buf, this.foundation, val => writeString(buf, val));
        writeOptional(buf, this.port, val => buf.writeShort(val));
        writeOptional(buf, this.priority, val => writeVarInt(buf, val));
        writeOptional(buf, this.protocol, val => writeString(buf, val));
        writeOptional(buf, this.relatedAddress, val => writeString(buf, val));
        writeOptional(buf, this.relatedPort, val => buf.writeShort(val));
        writeOptional(buf, this.sdpMid, val => writeString(buf, val));
        writeOptional(buf, this.sdpMLineIndex, val => writeVarInt(buf, val));
        writeOptional(buf, this.tcpType, val => writeString(buf, val));
        writeOptional(buf, this.type, val => writeString(buf, val));
        writeOptional(buf, this.usernameFragment, val => writeString(buf, val));
    }
}

export class RtcIceCandidatePacket extends Packet {

    public readonly candidate: PacketRtcIceCandidate;

    constructor(candidate: RTCIceCandidate) {
        super();
        this.candidate = new PacketRtcIceCandidate(candidate);
    }

    public encode(buf: ByteBuffer): void {
        this.candidate.encode(buf);
    }
}

export class RtcOfferPacket extends Packet {

    public readonly spd: string;

    constructor(spd: string) {
        super();
        this.spd = spd;
    }

    public encode(buf: ByteBuffer): void {
        writeString(buf, this.spd);
    }
}

export class VoiceActivityPacket extends Packet {

    public readonly active: boolean;

    constructor(active: boolean) {
        super();
        this.active = active;
    }

    public encode(buf: ByteBuffer): void {
        writeBoolean(buf, this.active);
    }
}

export class VolumePacket extends Packet {

    public readonly type: "category" | "player";
    public readonly entryId: UUID;
    public readonly volume: number;

    constructor(type: "category" | "player", entryId: UUID, volume: number) {
        super();
        this.type = type;
        this.entryId = entryId;
        this.volume = volume;
    }

    public encode(buf: ByteBuffer): void {
        writeBoolean(buf, this.type === "player");
        writeUniqueId(buf, this.entryId);
        buf.writeFloat(this.volume);
    }
}
