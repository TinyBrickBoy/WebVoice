import type {UUID} from "./uuid.ts";
import Long from "long";
import {AudioCategory, AudioRoom, PlayerState, Vector3d} from "./types.ts";
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

export interface Packet {
}

export interface EncodablePacket extends Packet {

    encode(buf: ByteBuffer): void;
}

// clientbound

const AUDIO_FLAG_HAS_CATEGORY = 1 << 0;
const AUDIO_FLAG_HAS_POSITION = 1 << 1;
const AUDIO_FLAG_SENDER_IS_CHANNEL = 1 << 2;

export class AudioPacket implements Packet {

    public readonly channelId: UUID;
    public readonly senderId: UUID;
    public readonly audio: Uint8Array;
    public readonly categoryId: UUID | null;
    public readonly position: Vector3d | null;

    constructor(buf: ByteBuffer) {
        const flags = buf.readByte();
        this.channelId = readUniqueId(buf);
        if ((flags & AUDIO_FLAG_SENDER_IS_CHANNEL) != 0) {
            this.senderId = this.channelId;
        } else {
            this.senderId = readUniqueId(buf);
        }
        this.audio = readByteArray(buf);
        if ((flags & AUDIO_FLAG_HAS_CATEGORY)) {
            this.categoryId = readUniqueId(buf);
        } else {
            this.categoryId = null;
        }
        if ((flags & AUDIO_FLAG_HAS_POSITION)) {
            this.position = new Vector3d(buf);
        } else {
            this.position = null;
        }
    }
}

export class CategoryAddPacket implements Packet {

    public readonly category: AudioCategory;

    constructor(buf: ByteBuffer) {
        this.category = new AudioCategory(buf);
    }
}

export class CategoryRemovePacket implements Packet {

    public readonly categoryId: UUID;

    constructor(buf: ByteBuffer) {
        this.categoryId = readUniqueId(buf);
    }
}

export class ConnectedPacket implements Packet {

    public readonly playerId: UUID;
    public readonly username: Component;

    constructor(buf: ByteBuffer) {
        this.playerId = readUniqueId(buf);
        this.username = readComponentJson(buf);
    }
}

export class PositionUpdatePacket implements Packet {

    public readonly position: Vector3d;

    constructor(buf: ByteBuffer) {
        this.position = new Vector3d(buf);
    }
}

export class RoomAddPacket implements Packet {

    public readonly room: AudioRoom;

    constructor(buf: ByteBuffer) {
        this.room = new AudioRoom(buf);
    }
}

export class RoomJoinResponsePacket implements Packet {

    public readonly success: boolean;

    constructor(buf: ByteBuffer) {
        this.success = readBoolean(buf);

    }
}

export class RoomRemovePacket implements Packet {

    public readonly roomId: UUID;

    constructor(buf: ByteBuffer) {
        this.roomId = readUniqueId(buf);
    }
}

export class StateRemovePacket implements Packet {

    public readonly playerId: UUID;

    constructor(buf: ByteBuffer) {
        this.playerId = readUniqueId(buf);
    }
}

export class StateUpdatePacket implements Packet {

    public readonly state: PlayerState;

    constructor(buf: ByteBuffer) {
        this.state = new PlayerState(buf);
    }
}

// commonbound

export class KeepAlivePacket implements EncodablePacket {

    public readonly id: Long;

    constructor(param: ByteBuffer | Long) {
        this.id = "readLong" in param ? param.readLong() : param;
    }

    public encode(buf: ByteBuffer): void {
        buf.writeLong(this.id);
    }
}

export class PingPacket implements EncodablePacket {

    public readonly id: Long;

    constructor(param: ByteBuffer | Long) {
        this.id = "readLong" in param ? param.readLong() : param;
    }

    public encode(buf: ByteBuffer): void {
        buf.writeLong(this.id);
    }
}

// servicebound

export class InputSoundPacket implements EncodablePacket {

    public readonly audio: Uint8Array;
    public readonly noiseReduction: boolean;

    constructor(audio: Uint8Array, noiseReduction: boolean) {
        this.audio = audio;
        this.noiseReduction = noiseReduction;
    }

    public encode(buf: ByteBuffer) {
        writeByteArray(buf, this.audio);
        writeBoolean(buf, this.noiseReduction);
    }
}

export class RoomCreatePacket implements EncodablePacket {

    public readonly name: string;
    public readonly password: string | null;
    public readonly speakToOthers: boolean;
    public readonly listenToOthers: boolean;

    constructor(name: string, password: string | null, speakToOthers: boolean, listenToOthers: boolean) {
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

export class RoomJoinRequestPacket implements EncodablePacket {

    public readonly roomId: UUID;
    public readonly password: string | null;

    constructor(roomId: UUID, password: string | null) {
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

export class RoomLeavePacket implements EncodablePacket {

    public readonly roomId: UUID;

    constructor(roomId: UUID) {
        this.roomId = roomId;
    }

    public encode(buf: ByteBuffer): void {
        writeUniqueId(buf, this.roomId);
    }
}

export class StateInfoPacket implements EncodablePacket {

    public readonly muted: boolean;
    public readonly deafened: boolean;

    constructor(muted: boolean, deafened: boolean) {
        this.muted = muted;
        this.deafened = deafened;
    }

    public encode(buf: ByteBuffer): void {
        writeBoolean(buf, this.muted);
        writeBoolean(buf, this.deafened);
    }
}
