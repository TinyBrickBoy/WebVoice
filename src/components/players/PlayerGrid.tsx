import type {FunctionComponent} from "preact";
import {useVoiceStateContext} from "../VoiceStateProvider.tsx";
import PlayerBlob from "./PlayerBlob.tsx";
import {useEffect, useMemo} from "preact/hooks";
import {AudioEndPacket, AudioPacket, StateRemovePacket, type StateUpdatePacket} from "../../scripts/network/packets.ts";
import {PlayerState} from "../../scripts/types.ts";
import {uuidFromString} from "../../scripts/util/uuid.ts";

const PlayerGrid: FunctionComponent = ({children}) => {
    const {players: [players, setPlayers], state: [state], socket, user: [{serverId}]} = useVoiceStateContext();

    useEffect(() => {
        if (state !== "connected") {
            setPlayers({
                "a62f4c41-f9cc-4d4a-8a2f-1dcccf6dfa97": new PlayerState(
                    uuidFromString("a62f4c41-f9cc-4d4a-8a2f-1dcccf6dfa97"),
                    "B00KY", true, true, uuidFromString("d87dd345-5b9b-492a-be3d-eeafe70362b0"), null,
                ),
            });
        }
    }, [state === "connected"]);

    useEffect(() => {
        return socket
            .registers()
            .register("open", () => setPlayers({}))
            .register("state_update", ({detail: {state}}: CustomEvent<StateUpdatePacket>) => {
                setPlayers(players => {
                    return {...players, [state.uniqueId.name]: state};
                });
            })
            .register("state_remove", ({detail: {playerId}}: CustomEvent<StateRemovePacket>) => {
                setPlayers(players => {
                    const newPlayers = {...players};
                    delete newPlayers[playerId.name];
                    return newPlayers;
                });
            })
            .callback();
    }, [socket]);

    useEffect(() => {
        return socket
            .registers()
            .register("audio", ({detail: {senderId}}: CustomEvent<AudioPacket>) => {
                players[senderId.name]?.tickSpeaking(true);
            })
            .register("audio_end", ({detail: {senderId}}: CustomEvent<AudioEndPacket>) => {
                players[senderId.name]?.tickSpeaking(false);
            })
            .callback();
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
            // @ts-ignore // this is intended and should be a fast method for comparing two bools
            const speaking = p1.speaking - p2.speaking;
            if (speaking !== 0) {
                return speaking;
            }
            return p1.lastSpeaking - p2.lastSpeaking;
        });
        return list;
    }, [players, serverId]);

    return <>
        <div className={"mb-3 mg:mb-0 p-3 mg:p-8 pb-0 grow flex flex-col gap-6"}>
            {children}
            <div
                className={"gap-2 xl:gap-4 grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] overflow-y-auto pl-2 pr-2"}
            >
                {playerList.map(state => <PlayerBlob key={state.uniqueId.name} state={state}/>)}
            </div>
        </div>
    </>;
};

export default PlayerGrid;
