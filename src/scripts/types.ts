import ByteBuffer from "bytebuffer";
import type {UUID} from "./util/uuid.ts";
import type {Component} from "./network/component.ts";
import {readBoolean, readComponentJson, readUniqueId} from "./network/buffer.ts";
import type {Dispatch, StateUpdater} from "preact/hooks";
import {EventManager} from "./util/events.ts";

export class Vector3d {

    public readonly x: number;
    public readonly y: number;
    public readonly z: number;

    constructor(buf: ByteBuffer);
    constructor(x: number, y: number, z: number);
    constructor(param: ByteBuffer | number, y?: number, z?: number) {
        if (typeof param == "number") {
            this.x = param;
            this.y = y || 0;
            this.z = z || 0;
        } else {
            this.x = param.readDouble();
            this.y = param.readDouble();
            this.z = param.readDouble();
        }
    }
}

export type Position3d = {
    pos: Vector3d,
    yaw: number,
    pitch: number,
}

export class CategoryState {

    public readonly uniqueId: UUID;
    public readonly name: Component;
    public readonly description: Component | null;

    constructor(uniqueId: UUID, name: Component, description: Component | null);
    constructor(buf: ByteBuffer);
    constructor(param: ByteBuffer | UUID, name?: Component, description?: Component | null) {
        if ("readByte" in param) {
            this.uniqueId = readUniqueId(param);
            this.name = readComponentJson(param);
            this.description = readBoolean(param) ? readComponentJson(param) : null;
        } else {
            this.uniqueId = param;
            this.name = name!!;
            this.description = description || null;
        }
    }
}

const ROOM_FLAG_PASSWORD = 1 << 0;
const ROOM_FLAG_JOINABLE = 1 << 1;
const ROOM_FLAG_SPEAK_TO_OTHERS = 1 << 2;
const ROOM_FLAG_LISTEN_TO_OTHERS = 1 << 3;

export class RoomState {

    public readonly uniqueId: UUID;
    public readonly name: Component;
    public readonly password: boolean;
    public readonly joinable: boolean;
    public readonly speakToOthers: boolean;
    public readonly listenToOthers: boolean;

    constructor(buf: ByteBuffer);
    constructor(uniqueId: UUID, name: Component, password: boolean, joinable: boolean, speakToOthers: boolean, listenToOthers: boolean);
    constructor(param: ByteBuffer | UUID, name?: Component, password?: boolean, joinable?: boolean, speakToOthers?: boolean, listenToOthers?: boolean) {
        if ("readByte" in param) {
            this.uniqueId = readUniqueId(param);
            this.name = readComponentJson(param);
            const flags = param.readByte();
            this.password = (flags & ROOM_FLAG_PASSWORD) != 0;
            this.joinable = (flags & ROOM_FLAG_JOINABLE) != 0;
            this.speakToOthers = (flags & ROOM_FLAG_SPEAK_TO_OTHERS) != 0;
            this.listenToOthers = (flags & ROOM_FLAG_LISTEN_TO_OTHERS) != 0;
        } else {
            this.uniqueId = param;
            this.name = name!!;
            this.password = password!!;
            this.joinable = joinable!!;
            this.speakToOthers = speakToOthers!!;
            this.listenToOthers = listenToOthers!!;
        }
    }
}

const STATE_FLAG_MUTED = 1 << 0;
const STATE_FLAG_DEAFENED = 1 << 1;
const STATE_FLAG_HAS_GROUP = 1 << 2;
const STATE_FLAG_HAS_SERVER = 1 << 3;

const STATE_SPEAK_EVENT_ON = new CustomEvent("speak", {detail: true});
const STATE_SPEAK_EVENT_OFF = new CustomEvent("speak", {detail: false});

export class PlayerState extends EventManager {

    public readonly uniqueId: UUID;
    public readonly name: Component;
    public readonly muted: boolean;
    public readonly deafened: boolean;
    public readonly primaryRoomId: UUID | null;
    public readonly serverId: UUID | null;
    public lastSpeaking: number = 0;
    public speaking: boolean = false;

    constructor(uniqueId: UUID, name: Component, muted: boolean, deafened: boolean, primaryRoomId: UUID | null, serverId: UUID | null);
    constructor(buf: ByteBuffer);
    constructor(param: ByteBuffer | UUID, name?: Component, muted?: boolean, deafened?: boolean, primaryRoomId?: UUID | null, serverId?: UUID | null) {
        super();
        if ("readByte" in param) {
            this.uniqueId = readUniqueId(param);
            this.name = readComponentJson(param);
            const flags = param.readByte();
            this.muted = (flags & STATE_FLAG_MUTED) != 0;
            this.deafened = (flags & STATE_FLAG_DEAFENED) != 0;
            if ((flags & STATE_FLAG_HAS_GROUP) != 0) {
                this.primaryRoomId = readUniqueId(param);
            } else {
                this.primaryRoomId = null;
            }
            if ((flags & STATE_FLAG_HAS_SERVER) != 0) {
                this.serverId = readUniqueId(param);
            } else {
                this.serverId = null;
            }
        } else {
            this.uniqueId = param;
            this.name = name!!;
            this.muted = muted!!;
            this.deafened = deafened!!;
            this.primaryRoomId = primaryRoomId || null;
            this.serverId = serverId || null;
        }
    }

    public is(uniqueId: UUID) {
        return this.uniqueId.name === uniqueId.name;
    }

    public in(roomId: UUID) {
        return this.primaryRoomId?.name === roomId.name;
    }

    public on(serverId: UUID | null) {
        return this.serverId?.name === serverId?.name;
    }

    public tickSpeaking(speaking?: boolean) {
        if (speaking === undefined) {
            speaking = Date.now() - this.lastSpeaking <= 130;
        } else if (speaking) {
            this.lastSpeaking = Date.now();
        }
        if (this.speaking !== speaking) {
            if (speaking) {
                this.speaking = true;
                this.fire(STATE_SPEAK_EVENT_ON);
            } else {
                this.speaking = false;
                this.fire(STATE_SPEAK_EVENT_OFF);
            }
        }
    }
}

export interface UserInfo {
    uniqueId: UUID;
    name: Component;
    serverId: UUID | null;
    serverName: Component | null;
    serverType: string | null;
}

export type AudioQueueData = {
    data: Float32Array,
    volume: number,
    source: Position3d | null,
    position: Vector3d | null,
    channel: string,
}

export type StateType<S> = [S, Dispatch<StateUpdater<S>>];
export type SocketState = "disconnected" | "connecting" | "connected"
