import {type Context, createContext, type FunctionComponent} from "preact";
import {VoiceSocket} from "../scripts/socket.ts";
import {type Dispatch, type StateUpdater, useContext, useState} from "preact/hooks";
import type {AudioCategory, AudioRoom, PlayerState, UserInfo} from "../scripts/types.ts";
import VoiceContainer from "./VoiceContainer.tsx";

type StateType<S> = [S, Dispatch<StateUpdater<S>>];

export type VoiceState = {
    user: StateType<UserInfo | null>,
    socket: StateType<VoiceSocket>,
    players: StateType<Record<string, PlayerState>>,
    rooms: StateType<Record<string, AudioRoom>>,
    categories: StateType<Record<string, AudioCategory>>,
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

const VoiceStateProvider: FunctionComponent<Props> = ({socketUrl, token}) => {
    const user = useState<UserInfo | null>(null);
    const socket = useState<VoiceSocket>(() => new VoiceSocket(socketUrl));
    const players = useState<Record<string, PlayerState>>({});
    const rooms = useState<Record<string, AudioRoom>>({});
    const categories = useState<Record<string, AudioCategory>>({});

    return <>
        <VoiceStateContext.Provider value={{user, socket, players, rooms, categories}}>
            <VoiceContainer socketUrl={socketUrl} token={token}/>
        </VoiceStateContext.Provider>
    </>;
};

export default VoiceStateProvider;
