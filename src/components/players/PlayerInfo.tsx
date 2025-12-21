import CraftHead from "../common/CraftHead.tsx";
import type {PlayerState} from "../../scripts/types.ts";
import type {FunctionComponent} from "preact";
import MinecraftComponent from "../common/MinecraftComponent.tsx";

type State = Pick<PlayerState, "uniqueId" | "name" | "speaking">

interface Props {
    state: State;
    hideHead?: boolean;
    hideName?: boolean;
}

const PlayerInfo: FunctionComponent<Props> = ({state: {uniqueId, name, speaking}, hideHead, hideName}) => {
    return (
        <div className={"flex flex-row gap-2 items-center"}>
            {!hideHead &&
                <div className={`rounded-md m-[0.2rem] ${speaking ? "outline-emerald-500 outline-[0.2rem]" : ""}`}>
                    <CraftHead className={"rounded-md"} uuid={uniqueId} size={48}/>
                </div>}
            {!hideName && <MinecraftComponent className={"text-xl"} component={name}/>}
        </div>
    );
};
export default PlayerInfo;
