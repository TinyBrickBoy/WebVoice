import type {FunctionComponent} from "preact";
import {useVoiceStateContext} from "./VoiceStateProvider.tsx";
import PlayerBlob from "./PlayerBlob.tsx";

const PlayerGrid: FunctionComponent = () => {
    const {players: [players]} = useVoiceStateContext();
    return <>
        <div className={"p-8 w-1/2 border-l-2 border-solid border-neutral-700"}>
            <div className={"flex flex-wrap flex-row"}>
                {Object.values(players).map(state => <PlayerBlob key={state.uniqueId.name} state={state}/>)}
            </div>
        </div>
    </>;
};

export default PlayerGrid;
