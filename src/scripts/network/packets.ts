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

export class VoiceActivityPacket extends DecodablePacket {

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

export class RtcOfferPacket extends DecodablePacket {

    public readonly type: string;
    public readonly sdp: string | null;

    constructor(type: string, sdp: string | null);
    constructor(buf: ByteBuffer);
    constructor(param: ByteBuffer | string, sdp?: string | null) {
        super();
        if (typeof param !== "string") {
            this.type = readString(param);
            this.sdp = readOptional(param, () => readString(param));
        } else {
            this.type = param;
            this.sdp = sdp ?? null;
        }
    }

    public encode(buf: ByteBuffer): void {
        writeString(buf, this.type);
        writeOptional(buf, this.sdp, val => writeString(buf, val));
    }
}

export class RtcIceCandidatePacket extends DecodablePacket {

    public readonly sdp: string | null;
    public readonly sdpMid: string | null;
    public readonly sdpMLineIndex: number | null;

    constructor(sdp: string | null, sdpMid: string | null, sdpMLineIndex: number | null);
    constructor(buf: ByteBuffer);
    constructor(param: ByteBuffer | string | null, sdpMid?: string | null, sdpMLineIndex?: number | null) {
        super();
        if (param && typeof param !== "string") {
            this.sdp = readOptional(param, () => readString(param));
            this.sdpMid = readOptional(param, () => readString(param));
            this.sdpMLineIndex = readOptional(param, () => readVarInt(param));
        } else {
            this.sdp = param;
            this.sdpMid = sdpMid ?? null;
            this.sdpMLineIndex = sdpMLineIndex ?? null;
        }
    }

    public encode(buf: ByteBuffer): void {
        writeOptional(buf, this.sdp, val => writeString(buf, val));
        writeOptional(buf, this.sdpMid, val => writeString(buf, val));
        writeOptional(buf, this.sdpMLineIndex, val => writeVarInt(buf, val));
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
