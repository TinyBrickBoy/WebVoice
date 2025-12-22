import {type Context, createContext, type FunctionComponent} from "preact";
import {VoiceSocket} from "../scripts/socket.ts";
import {useContext, useEffect, useMemo, useState} from "preact/hooks";
import {
    type CategoryState,
    PlayerState,
    type RoomState,
    type SocketState,
    type StateType,
    type UserInfo,
} from "../scripts/types.ts";
import VoiceContainer from "./layout/VoiceContainer.tsx";
import {uuidFromString} from "../scripts/util/uuid.ts";
import {AudioDeviceManager} from "../scripts/audio/audio_devices.ts";
import {AudioControls} from "../scripts/audio/audio_controls.ts";
import {VolumeManager} from "../scripts/audio/volumes.ts";
import {AudioMicrophoneManager} from "../scripts/audio/audio_mic.ts";
import AudioPlayer from "../scripts/audio/audio_player.ts";
import {startSpeakingTask} from "../scripts/util/speaking_task.ts";

export type VoiceState = {
    socketUrl: URL,
    user: StateType<UserInfo>,
    socket: VoiceSocket,
    players: StateType<Record<string, PlayerState>>,
    rooms: StateType<Record<string, RoomState>>,
    categories: StateType<Record<string, CategoryState>>,
    state: StateType<SocketState>,
    devices: AudioDeviceManager,
    controls: AudioControls,
    volumes: VolumeManager,
    microphone: AudioMicrophoneManager,
    audio: AudioPlayer,
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
    uniqueId: uuidFromString("606e2ff0-ed77-4842-9d6c-e1d3321c7838"),
    name: {text: "Unknown", italic: true},
    serverId: null,
    serverName: null,
    serverType: null,
} as UserInfo;

const VoiceStateProvider: FunctionComponent<Props> = ({socketUrl}) => {
    const user = useState<UserInfo>(defaultUser);
    const players = useState<Record<string, PlayerState>>({});
    const rooms = useState<Record<string, RoomState>>({});
    const categories = useState<Record<string, CategoryState>>({});
    const state = useState<SocketState>("disconnected");

    // global manager states
    const socket = useMemo(() => new VoiceSocket(socketUrl), [socketUrl]);
    const devices = useMemo(() => new AudioDeviceManager(), []);
    useEffect(() => devices.registerMediaListener(), [devices]);
    const controls = useMemo(() => new AudioControls(), []);
    const volumes = useMemo(() => new VolumeManager(), []);

    // create global microphone manager
    const microphone = useMemo(
        () => new AudioMicrophoneManager(socket, devices, controls, volumes),
        [socket, devices, controls, volumes],
    );
    // destroy context if microphone manager gets re-created
    useEffect(() => (() => microphone.triggerTeardown()), [microphone]);

    // create global audio player
    const audio = useMemo(
        () => new AudioPlayer(microphone, controls, devices, volumes),
        [microphone, controls, devices, volumes],
    );
    useEffect(() => audio.startTasks(), [audio]);
    useEffect(() => audio.registerSocket(socket), [audio, socket]);

    // create audio speaking ticker task
    const [_refresh, setRefresh] = useState<number>(0);
    useEffect(() => startSpeakingTask(controls, user, players, setRefresh), [controls, players]);

    return <>
        <VoiceStateContext.Provider
            value={{
                socketUrl,
                user,
                socket,
                players,
                rooms,
                categories,
                state,
                devices,
                controls,
                volumes,
                microphone,
                audio,
            }}
        >
            <VoiceContainer socketUrl={socketUrl}/>
        </VoiceStateContext.Provider>
    </>;
};

export default VoiceStateProvider;
