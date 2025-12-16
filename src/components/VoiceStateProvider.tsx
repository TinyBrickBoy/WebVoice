import {type Context, createContext, type FunctionComponent} from "preact";
import {VoiceSocket} from "../scripts/socket.ts";
import {useContext, useEffect, useMemo, useState} from "preact/hooks";
import {
    type AudioCategory,
    type AudioRoom,
    PlayerState,
    type SocketState,
    type StateType,
    type UserInfo,
} from "../scripts/types.ts";
import VoiceContainer from "./VoiceContainer.tsx";
import {uuidFromString} from "../scripts/util/uuid.ts";
import {AudioDeviceManager} from "../scripts/audio/audio_devices.ts";

export type VoiceState = {
    socketUrl: URL,
    user: StateType<UserInfo>,
    socket: StateType<VoiceSocket>,
    players: StateType<Record<string, PlayerState>>,
    rooms: StateType<Record<string, AudioRoom>>,
    categories: StateType<Record<string, AudioCategory>>,
    state: StateType<SocketState>,
    devices: AudioDeviceManager,
}

// @ts-ignore it will be fiiiine, I don't want to spam null checks everywhere
export const VoiceStateContext: Context<VoiceState> = createContext({});

export const useVoiceStateContext = () => {
    return useContext(VoiceStateContext);
};

interface Props {
    socketUrl: URL;
    token: string;
}

const defaultUser = {
    uuid: uuidFromString("606e2ff0-ed77-4842-9d6c-e1d3321c7838"),
    name: {text: "Unknown", italic: true},
    serverId: null,
    serverName: {text: "Hide & Seek » Modern Island", color: "gold"}, // TODO remove
    serverType: "hide_and_seek/modern_island", // TODO remove
} as UserInfo;

const VoiceStateProvider: FunctionComponent<Props> = ({socketUrl}) => {
    const user = useState<UserInfo>(defaultUser);
    const socket = useState<VoiceSocket>(() => new VoiceSocket(socketUrl));
    const players = useState<Record<string, PlayerState>>({});
    const rooms = useState<Record<string, AudioRoom>>({});
    const categories = useState<Record<string, AudioCategory>>({});
    const state = useState<SocketState>("disconnected");
    const devices = useMemo(() => new AudioDeviceManager(), []);
    useEffect(() => devices.registerMediaListener(), [devices]);

    return <>
        <VoiceStateContext.Provider value={{socketUrl, user, socket, players, rooms, categories, state, devices}}>
            <VoiceContainer socketUrl={socketUrl}/>
        </VoiceStateContext.Provider>
    </>;
};

export default VoiceStateProvider;
