export type PacketPlayerState = {
    playerId: string;
    name: string;
    disabled: boolean;
    disconnected: boolean;
}
export type PacketVoiceCategory = {
    id: string;
    name: string;
    description: string;
}

export type SonusInfoPacket = {
    player: string;
    username: string;
}
export type AddCategoryPacket = PacketVoiceCategory
export type PlayerStatesPacket = {
    states: PacketPlayerState[];
}
export type PlayerStatePacket = PacketPlayerState