import {type Context, createContext, type FunctionComponent} from "preact";
import {VoiceSocket} from "../scripts/socket.ts";
import {useContext, useEffect, useState} from "preact/hooks";
import {
    type AudioCategory,
    type AudioRoom,
    PlayerState,
    type SocketState,
    type SonusSettings,
    type StateType,
    type UserInfo,
} from "../scripts/types.ts";
import VoiceContainer from "./VoiceContainer.tsx";
import {uuidFromString} from "../scripts/util/uuid.ts";
import {DEFAULT_DEVICE_ID} from "../scripts/audio/audio_mic.ts";

export type VoiceState = {
    socketUrl: URL,
    user: StateType<UserInfo>,
    socket: StateType<VoiceSocket>,
    players: StateType<Record<string, PlayerState>>,
    rooms: StateType<Record<string, AudioRoom>>,
    categories: StateType<Record<string, AudioCategory>>,
    state: StateType<SocketState>,
    settings: StateType<SonusSettings>,
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

const defaultSettings = {
    microphoneId: DEFAULT_DEVICE_ID,
} as SonusSettings;

const loadSettings = () => {
    const value = localStorage.getItem("sonus:settings");
    if (value) {
        return JSON.parse(value) as SonusSettings;
    }
    return defaultSettings;
};
const saveSettings = (settings: SonusSettings) => {
    localStorage.setItem("sonus:settings", JSON.stringify(settings));
};

const VoiceStateProvider: FunctionComponent<Props> = ({socketUrl}) => {
    const user = useState<UserInfo>(defaultUser);
    const socket = useState<VoiceSocket>(() => new VoiceSocket(socketUrl));
    const players = useState<Record<string, PlayerState>>({});
    const rooms = useState<Record<string, AudioRoom>>({});
    const categories = useState<Record<string, AudioCategory>>({});
    const state = useState<SocketState>("disconnected");

    const [settings, setSettings] = useState<SonusSettings>(loadSettings());
    useEffect(() => saveSettings(settings), [settings]);

    return <>
        <VoiceStateContext.Provider
            value={{socketUrl, user, socket, players, rooms, categories, state, settings: [settings, setSettings]}}
        >
            <VoiceContainer socketUrl={socketUrl}/>
        </VoiceStateContext.Provider>
    </>;
};

export default VoiceStateProvider;
