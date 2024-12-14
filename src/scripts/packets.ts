import type {UUID} from "./uuid.ts";
import Long from "long";

// meta

export type PacketPlayerState = {
    playerId: UUID;
    name: string;
    disabled: boolean;
    disconnected: boolean;
    groupId?: string;
}
export type PacketVoiceCategory = {
    id: string;
    name: string;
    description?: string;
}

export type SonusInfoPacket = {
    player: UUID;
    username: string;
    image?: string;
    secret: UUID;
}
export type AddCategoryPacket = PacketVoiceCategory
export type RemoveCategoryPacket = {
    categoryId: string;
}
export type PlayerStatesPacket = {
    states: PacketPlayerState[];
}
export type PlayerStatePacket = PacketPlayerState

// voice

export type SoundPacket = {
    channelId: UUID;
    sender: UUID;
    data: ArrayBuffer;
    sequenceNumber: Long;
    category?: string;
}
export type Vector3d = {
    x: number;
    y: number;
    z: number;
}

export type UpdateStatePacket = {
    disabled: boolean;
}

export type MicPacket = { // 0x01
    data: ArrayBuffer;
    whispering: boolean;
    sequenceNumber: Long;
}
export type PlayerSoundPacket = SoundPacket & { // 0x02
    whispering: boolean;
    distance: number;
}
export type GroupSoundPacket = SoundPacket & { // 0x03
}
export type LocationSoundPacket = SoundPacket & { // 0x04
    location: Vector3d;
    distance: number;
}
export type AuthenticatePacket = { // 0x05
    player: UUID;
    secret: UUID;
}
export type AuthenticateAckPacket = { // 0x06
}
export type PingPacket = { // 0x07
    id: UUID;
    timestamp: Long;
}
export type KeepAlivePacket = { // 0x08
}
export type ConnectionCheckPacket = { // 0x09
}
export type ConnectionCheckAckPacket = { // 0x0A
}