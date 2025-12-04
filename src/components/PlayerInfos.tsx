import PlayerInfo from "./PlayerInfo.tsx";
import type {FunctionComponent} from "preact";
import {useVoiceStateContext} from "./VoiceStateProvider.tsx";

const PlayerInfos: FunctionComponent = () => {
    const {players: [players]} = useVoiceStateContext();

    const playerValues = Object.values(players);
    return <>
        <details open={true}>
            <summary>Players ({playerValues.length})</summary>
            <div className={"flex flex-col"}>
                {Object.values(players)
                    .filter(state => !state.deafened)
                    .map(state => (
                        <PlayerInfo key={state.uniqueId.name} state={state}/>
                    ))}
            </div>
        </details>
    </>;
};
export default PlayerInfos;
