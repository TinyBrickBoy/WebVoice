import type {PlayerState} from "../scripts/types.ts";
import type {FunctionComponent} from "preact";
import CraftHead from "./CraftHead.tsx";

interface Props {
    state: PlayerState;
}

const PlayerBlob: FunctionComponent<Props> = ({state}) => {
    return <>
        <div className={"bg-amber-500 p-15 m-5 flex justify-center items-center"}>
            <CraftHead uuid={state.uniqueId} size={128}/>
        </div>
    </>;
};

export default PlayerBlob;
