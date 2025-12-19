import CraftHead from "../common/CraftHead.tsx";
import type {PlayerState} from "../../scripts/types.ts";
import type {FunctionComponent} from "preact";
import MinecraftComponent from "../common/MinecraftComponent.tsx";

interface Props {
    state: PlayerState;
}

const PlayerInfo: FunctionComponent<Props> = ({state: {uniqueId, name, speaking}}) => {
    return (
        <div className={"flex flex-row gap-2 items-center"}>
            <div className={`rounded-md m-[0.2rem] ${speaking ? "outline-emerald-500 outline-[0.2rem]" : ""}`}>
                <CraftHead uuid={uniqueId} size={48}/>
            </div>
            <MinecraftComponent className={"text-xl"} component={name}/>
        </div>
    );
};
export default PlayerInfo;
