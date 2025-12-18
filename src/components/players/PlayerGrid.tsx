import type {FunctionComponent} from "preact";
import {useVoiceStateContext} from "../VoiceStateProvider.tsx";
import PlayerBlob from "./PlayerBlob.tsx";
import {useEffect, useMemo, useState} from "preact/hooks";
import {AudioPacket, type StateUpdatePacket} from "../../scripts/network/packets.ts";
import MinecraftComponent from "../common/MinecraftComponent.tsx";
import {PlayerState} from "../../scripts/types.ts";
import {uuidFromString} from "../../scripts/util/uuid.ts";

const PlayerGrid: FunctionComponent = () => {
    const {players: [players, setPlayers], socket: [socket], user: [{serverId, serverName}]} = useVoiceStateContext();

    useEffect(() => {
        if (!socket.isActive()) {
            setPlayers({
                "a62f4c41-f9cc-4d4a-8a2f-1dcccf6dfa97": new PlayerState(
                    uuidFromString("a62f4c41-f9cc-4d4a-8a2f-1dcccf6dfa97"),
                    "B00KY", true, true, null, null,
                ),
            });
        }
        return socket
            .registers()
            .register("open", () => setPlayers({}))
            .register("state_update", ({detail: {state}}: CustomEvent<StateUpdatePacket>) => {
                setPlayers(players => {
                    return {...players, [state.uniqueId.name]: state};
                });
            })
            .callback();
    }, [socket]);

    const [_refresh, setRefresh] = useState<number>(0);
    useEffect(() => {
        return socket.register("audio", ({detail: {senderId, audio}}: CustomEvent<AudioPacket>) => {
            const state = players[senderId.name];
            if (!state) {
                return; // unknown player
            }
            state.lastSpeaking = Date.now();
            // zero-length audio data marks the end of an audio stream
            const speakState = audio.length > 0;
            if (state.speaking !== speakState) {
                state.speaking = speakState;
                setRefresh(i => i + 1);
            }
        });
    }, [socket, players]);

    const playerList = useMemo(() => {
        const list = Object.values(players)
            .filter(player => player.on(serverId));
        // order of players: speakers, [default], muted, deafened
        list.sort((p1, p2) => {
            // @ts-ignore // this is intended and should be a fast method for comparing two bools
            const deaf = p1.deafened - p2.deafened;
            if (deaf !== 0) {
                return deaf;
            }
            // @ts-ignore // this is intended and should be a fast method for comparing two bools
            const mute = p1.muted - p2.muted;
            if (mute !== 0) {
                return mute;
            }
            return p1.lastSpeaking - p2.lastSpeaking;
        });
        return list;
    }, [players, serverId]);

    return <>
        <div className={"p-8 pb-0 grow flex flex-col gap-6"}>
            <div className={"flex flex-col"}>
                <span className={"text-sm"}>Current server</span>
                <MinecraftComponent noColor className={"text-xl capitalize"} component={serverName || "none"}/>
            </div>
            <div
                className={"gap-2 xl:gap-4 grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] overflow-y-auto pl-2 pr-2"}
            >
                {playerList.map(state => <PlayerBlob key={state.uniqueId.name} state={state}/>)}
            </div>
        </div>
    </>;
};

export default PlayerGrid;
