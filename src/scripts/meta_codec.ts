import type {
    AddCategoryPacket,
    PlayerStatePacket,
    PlayerStatesPacket,
    RemoveCategoryPacket,
    SonusAuthPacket,
    SonusInfoPacket,
    UpdateStatePacket,
} from "./packets.ts";
import {uuidFromString} from "./uuid.ts";

type Encoder<T> = (data: T) => any
type Decoder<T> = (json: any) => T

const encoders: ({ [key: string]: Encoder<any> } | undefined) = {
    "voicechat:update_state": (data: UpdateStatePacket) => data,
    "tjcsonus:auth": (data: SonusAuthPacket) => data,
};
const decoders: ({ [key: string]: Decoder<any> } | undefined) = {
    "voicechat:add_category": (json: any): AddCategoryPacket => json,
    "voicechat:player_state": (json: any): PlayerStatePacket => {
        return {
            playerId: uuidFromString(json.playerId),
            groupId: json.groupId ? uuidFromString(json.groupId) : undefined,
            ...json,
        };
    },
    "voicechat:player_states": (json: any): PlayerStatesPacket => {
        return {
            states: json.states.map((state: any) => {
                return {
                    playerId: uuidFromString(state.playerId),
                    groupId: json.groupId ? uuidFromString(state.groupId) : undefined,
                    ...json,
                };
            }),
        };
    },
    "voicechat:remove_category": (json: any): RemoveCategoryPacket => json,
    "tjcsonus:info": (json: any): SonusInfoPacket => {
        return {
            player: uuidFromString(json.player),
            secret: uuidFromString(json.secret),
            ...json,
        };
    },
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