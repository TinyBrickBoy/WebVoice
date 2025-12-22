import CraftHead from "../common/CraftHead.tsx";
import type {PlayerState} from "../../scripts/types.ts";
import type {FunctionComponent} from "preact";
import MinecraftComponent from "../common/MinecraftComponent.tsx";
import DeafenedIcon from "../icons/DeafenedIcon.tsx";
import MutedIcon from "../icons/MutedIcon.tsx";
import Tooltip from "../common/Tooltip.tsx";

type State = Pick<PlayerState, "uniqueId" | "name" | "speaking" | "muted" | "deafened">

interface Props {
    state: State;
    hideHead?: boolean;
    hideName?: boolean;
    hideControls?: boolean;
}

const PlayerInfo: FunctionComponent<Props> = ({state, hideHead, hideName, hideControls}) => {
    const {uniqueId, name, speaking, muted, deafened} = state;
    return <>
        <div className={"flex flex-row gap-2 items-center"}>
            {!hideHead &&
                <div className={`rounded-md m-[0.2rem] ${speaking ? "outline-emerald-500 outline-[0.2rem]" : ""}`}>
                    <Tooltip align={"top"} hint={<MinecraftComponent component={name}/>}>
                        <CraftHead className={"rounded-md w-12"} uuid={uniqueId}/>
                    </Tooltip>
                </div>}
            {!hideName && <MinecraftComponent className={"text-xl"} component={name}/>}
            {!hideControls && (deafened ? <DeafenedIcon/> : muted ? <MutedIcon/> : <></>)}
        </div>
    </>;
};
export default PlayerInfo;
