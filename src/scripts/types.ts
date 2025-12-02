import ByteBuffer from "bytebuffer";
import type {UUID} from "./util/uuid.ts";
import type {Component} from "./network/component.ts";
import {readBoolean, readComponentJson, readUniqueId} from "./network/buffer.ts";
import type {Packet} from "./network/packets.ts";

export class Vector3d {

    public readonly x: number;
    public readonly y: number;
    public readonly z: number;

    constructor(buf: ByteBuffer) {
        this.x = buf.readDouble();
        this.y = buf.readDouble();
        this.z = buf.readDouble();
    }
}

export class AudioCategory {

    public readonly uniqueId: UUID;
    public readonly name: Component;
    public readonly description: Component | null;
    public volume: number = 1;

    constructor(buf: ByteBuffer) {
        this.uniqueId = readUniqueId(buf);
        this.name = readComponentJson(buf);
        this.description = readBoolean(buf) ? readComponentJson(buf) : null;
    }
}

const ROOM_FLAG_PASSWORD = 1 << 0;
const ROOM_FLAG_JOINABLE = 1 << 1;
const ROOM_FLAG_SPEAK_TO_OTHERS = 1 << 2;
const ROOM_FLAG_LISTEN_TO_OTHERS = 1 << 3;

export class AudioRoom {

    public readonly uniqueId: UUID;
    public readonly name: Component;
    public readonly password: boolean;
    public readonly joinable: boolean;
    public readonly speakToOthers: boolean;
    public readonly listenToOthers: boolean;
    public volume: number = 1;

    constructor(buf: ByteBuffer) {
        this.uniqueId = readUniqueId(buf);
        this.name = readComponentJson(buf);
        const flags = buf.readByte();
        this.password = (flags & ROOM_FLAG_PASSWORD) != 0;
        this.joinable = (flags & ROOM_FLAG_JOINABLE) != 0;
        this.speakToOthers = (flags & ROOM_FLAG_SPEAK_TO_OTHERS) != 0;
        this.listenToOthers = (flags & ROOM_FLAG_LISTEN_TO_OTHERS) != 0;
    }
}

const STATE_FLAG_MUTED = 1 << 0;
const STATE_FLAG_DEAFENED = 1 << 1;
const STATE_FLAG_HAS_GROUP = 1 << 2;

export class PlayerState {

    public readonly uniqueId: UUID;
    public readonly name: Component;
    public readonly muted: boolean;
    public readonly deafened: boolean;
    public readonly primaryRoomId: UUID | null;
    public volume: number = 1;

    constructor(buf: ByteBuffer) {
        this.uniqueId = readUniqueId(buf);
        this.name = readComponentJson(buf);
        const flags = buf.readByte();
        this.muted = (flags & STATE_FLAG_MUTED) != 0;
        this.deafened = (flags & STATE_FLAG_DEAFENED) != 0;
        if ((flags & STATE_FLAG_HAS_GROUP) != 0) {
            this.primaryRoomId = readUniqueId(buf);
        } else {
            this.primaryRoomId = null;
        }
    }

    public is(uniqueId: UUID) {
        return this.uniqueId.name === uniqueId.name;
    }

    public in(roomId: UUID) {
        return this.primaryRoomId?.name === roomId.name;
    }
}

export type SendPacket = (packet: Packet) => void;
