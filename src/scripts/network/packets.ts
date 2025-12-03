import type {UUID} from "../util/uuid.ts";
import Long from "long";
import {AudioCategory, AudioRoom, PlayerState, Vector3d} from "../types.ts";
import ByteBuffer from "bytebuffer";
import {
    readBoolean,
    readByteArray,
    readComponentJson,
    readUniqueId,
    writeBoolean,
    writeByteArray,
    writeString,
    writeUniqueId,
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

const AUDIO_FLAG_HAS_CATEGORY = 1 << 0;
const AUDIO_FLAG_HAS_POSITION = 1 << 1;
const AUDIO_FLAG_SENDER_IS_CHANNEL = 1 << 2;

export class AudioPacket extends DecodablePacket {

    public readonly channelId: UUID;
    public readonly senderId: UUID;
    public readonly audio: Uint8Array;
    public readonly categoryId: UUID | null;
    public readonly position: Vector3d | null;

    constructor(buf: ByteBuffer) {
        super();
        const flags = buf.readByte();
        this.channelId = readUniqueId(buf);
        if ((flags & AUDIO_FLAG_SENDER_IS_CHANNEL) != 0) {
            this.senderId = this.channelId;
        } else {
            this.senderId = readUniqueId(buf);
        }
        this.audio = readByteArray(buf);
        if ((flags & AUDIO_FLAG_HAS_CATEGORY) != 0) {
            this.categoryId = readUniqueId(buf);
        } else {
            this.categoryId = null;
        }
        if ((flags & AUDIO_FLAG_HAS_POSITION) != 0) {
            this.position = new Vector3d(buf);
        } else {
            this.position = null;
        }
    }
}

export class CategoryAddPacket extends DecodablePacket {

    public readonly category: AudioCategory;

    constructor(buf: ByteBuffer) {
        super();
        this.category = new AudioCategory(buf);
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

    constructor(buf: ByteBuffer) {
        super();
        this.playerId = readUniqueId(buf);
        this.username = readComponentJson(buf);
    }
}

export class PositionUpdatePacket extends DecodablePacket {

    public readonly position: Vector3d;

    constructor(buf: ByteBuffer) {
        super();
        this.position = new Vector3d(buf);
    }
}

export class RoomAddPacket extends DecodablePacket {

    public readonly room: AudioRoom;

    constructor(buf: ByteBuffer) {
        super();
        this.room = new AudioRoom(buf);
    }
}

export class RoomJoinResponsePacket extends DecodablePacket {

    public readonly roomId: UUID;
    public readonly success: boolean;

    constructor(buf: ByteBuffer) {
        super();
        this.roomId = readUniqueId(buf)
        this.success = readBoolean(buf);
    }
}

export class RoomLeaveResponsePacket extends DecodablePacket {

    public readonly roomId: UUID;
    public readonly success: boolean;

    constructor(buf: ByteBuffer) {
        super();
        this.roomId = readUniqueId(buf)
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

// commonbound

export class KeepAlivePacket extends DecodablePacket {

    public readonly id: Long;

    constructor(id: Long);
    constructor(buf: ByteBuffer);
    constructor(param: ByteBuffer | Long) {
        super();
        this.id = "readLong" in param ? param.readLong() : param;
    }

    public encode(buf: ByteBuffer): void {
        buf.writeLong(this.id);
    }
}

export class PingPacket extends DecodablePacket {

    public readonly id: Long;

    constructor(id: Long);
    constructor(buf: ByteBuffer);
    constructor(param: ByteBuffer | Long) {
        super();
        this.id = "readLong" in param ? param.readLong() : param;
    }

    public encode(buf: ByteBuffer): void {
        buf.writeLong(this.id);
    }
}

// servicebound

export class InputSoundPacket extends Packet {

    public readonly audio: Uint8Array;
    public readonly noiseReduction: boolean;

    constructor(audio: Uint8Array, noiseReduction: boolean) {
        super();
        this.audio = audio;
        this.noiseReduction = noiseReduction;
    }

    public encode(buf: ByteBuffer) {
        writeByteArray(buf, this.audio);
        writeBoolean(buf, this.noiseReduction);
    }
}

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

// TODO implement
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
