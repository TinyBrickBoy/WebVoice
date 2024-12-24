import type {UUID} from "./uuid.ts";
import Long from "long";

// meta

export type PacketPlayerState = {
    playerId: UUID;
    name: string;
    disabled: boolean;
    disconnected: boolean;
    groupId?: UUID;
}
export type PacketVoiceCategory = {
    id: string;
    name: string;
    description?: string;
}
export type PacketClientGroupType = "normal" | "open" | "isolated";
export type PacketClientGroup = {
    groupId: UUID;
    name: string;
    password: boolean;
    persistent: boolean;
    hidden: boolean;
    type: PacketClientGroupType;
}

export type SonusAuthPacket = { // tjcsonus:auth
    token: string;
}
export type SonusInfoPacket = { // tjcsonus:info
    player: UUID;
    username: string;
    image?: string;
    secret: UUID;
}
export type SonusResetPacket = { // tjcsonus:reset
}
export type AddCategoryPacket = PacketVoiceCategory // voicechat:add_category
export type RemoveCategoryPacket = { // voicechat:remove_category
    categoryId: string;
}
export type PlayerStatesPacket = { // voicechat:player_states
    states: PacketPlayerState[];
}
export type PlayerStatePacket = PacketPlayerState // voicechat:player_state
export type AddGroupPacket = PacketClientGroup; // voicechat:add_group
export type RemoveGroupPacket = { // voicechat:remove_group
    groupId: UUID;
}
export type CreateGroupPacket = { // voicechat:create_group
    name: string;
    password?: string;
    type: PacketClientGroupType;
}
export type JoinedGroupPacket = { // voicechat:joined_group
    groupId: UUID;
    password?: string;
}
export type LeaveGroupPacket = { // voicechat:leave_group
}

// voice

export type SoundPacket = {
    channelId: UUID;
    sender: UUID;
    data: Uint8Array;
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
    data: Uint8Array;
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