import type {
    AddCategoryPacket,
    AddGroupPacket,
    CreateGroupPacket, JoinedGroupPacket,
    JoinGroupPacket,
    LeaveGroupPacket,
    PlayerStatePacket,
    PlayerStatesPacket,
    RemoveCategoryPacket,
    RemoveGroupPacket,
    SonusAuthPacket,
    SonusInfoPacket,
    SonusResetPacket,
    UpdateStatePacket,
} from "./packets.ts";
import {uuidFromString} from "./uuid.ts";

type Encoder<T> = (data: T) => any
type Decoder<T> = (json: any) => T

const encoders: ({ [key: string]: Encoder<any> } | undefined) = {
    "voicechat:update_state": (data: UpdateStatePacket) => data,
    "voicechat:create_group": (data: CreateGroupPacket) => data,
    "voicechat:set_group": (data: JoinGroupPacket) => {
        return {
            ...data,
            groupId: data.groupId.name,
        };
    },
    "voicechat:leave_group": (data: LeaveGroupPacket) => data,
    "tjcsonus:auth": (data: SonusAuthPacket) => data,
};
const decoders: ({ [key: string]: Decoder<any> } | undefined) = {
    "voicechat:add_category": (json: any): AddCategoryPacket => json,
    "voicechat:player_state": (json: any): PlayerStatePacket => {
        return {
            ...json,
            playerId: uuidFromString(json.playerId),
            groupId: json.groupId ? uuidFromString(json.groupId) : undefined,
        };
    },
    "voicechat:player_states": (json: any): PlayerStatesPacket => {
        return {
            states: json.states.map((state: any) => {
                return {
                    ...state,
                    playerId: uuidFromString(state.playerId),
                    groupId: state.groupId ? uuidFromString(state.groupId) : undefined,
                };
            }),
        };
    },
    "voicechat:remove_category": (json: any): RemoveCategoryPacket => json,
    "voicechat:add_group": (json: any): AddGroupPacket => {
        return {
            ...json,
            groupId: uuidFromString(json.groupId),
        };
    },
    "voicechat:remove_group": (json: any): RemoveGroupPacket => {
        return {
            ...json,
            groupId: uuidFromString(json.groupId),
        };
    },
    "voicechat:joined_group": (json: any): JoinedGroupPacket => {
        return {
            ...json,
            groupId: uuidFromString(json.groupId),
        };
    },
    "tjcsonus:info": (json: any): SonusInfoPacket => {
        return {
            ...json,
            player: uuidFromString(json.player),
            secret: uuidFromString(json.secret),
        };
    },
    "tjcsonus:reset": (json: any): SonusResetPacket => json,
};

export const encodeMetaJson = (packet: { key: string; packet: any }): any => {
    const encoder = encoders[packet.key];
    if (!encoder) {
        throw new Error("No encoder registered for meta packet with key " + packet.key);
    }
    return {key: packet.key, packet: encoder(packet.packet)};
};
export const decodeMetaJson = (json: any): { key: string; packet: any } => {
    const packetKey = json.key;
    const decoder = decoders[packetKey];
    if (!decoder) {
        throw new Error("No decoder registered for meta packet with key " + packetKey.toString());
    }
    const data = decoder(json.packet);
    return {key: packetKey, packet: data};
};