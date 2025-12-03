import type {FunctionComponent} from "preact";
import {useVoiceStateContext} from "./VoiceStateProvider.tsx";
import PlayerBlob from "./PlayerBlob.tsx";

const PlayerGrid: FunctionComponent = () => {
    const {players: [players]} = useVoiceStateContext();
    return <>
        <div className={"p-8 grow grid grid-cols-4 bg-amber-900"}>
            {Object.values(players).map(state => <PlayerBlob key={state.uniqueId.name} state={state}/>)}
        </div>
    </>;
};

export default PlayerGrid;
