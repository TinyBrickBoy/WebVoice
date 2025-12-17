import CraftHead from "../common/CraftHead.tsx";
import type {PlayerState} from "../../scripts/types.ts";
import type {FunctionComponent} from "preact";
import MinecraftComponent from "../common/MinecraftComponent.tsx";

interface Props {
    state: PlayerState;
}

const PlayerInfo: FunctionComponent<Props> = ({state}) => {
    return (
        <div className={"flex flex-row gap-2 items-center"}>
            <CraftHead uuid={state.uniqueId} size={48}/>
            <MinecraftComponent className={"text-xl"} component={state.name}/>
        </div>
    );
};
export default PlayerInfo;
