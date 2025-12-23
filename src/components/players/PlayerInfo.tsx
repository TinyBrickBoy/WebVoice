import CraftHead from "../common/CraftHead.tsx";
import type {PlayerState} from "../../scripts/types.ts";
import type {FunctionComponent} from "preact";
import MinecraftComponent from "../common/MinecraftComponent.tsx";
import DeafenedIcon from "../icons/DeafenedIcon.tsx";
import MutedIcon from "../icons/MutedIcon.tsx";
import Tooltip from "../common/Tooltip.tsx";
import SpeakingOutline from "./SpeakingOutline.tsx";

type State = Pick<PlayerState, "uniqueId" | "name" | "speaking" | "muted" | "deafened" | "register">

interface Props {
    state: State;
    hideHead?: boolean;
    hideName?: boolean;
    hideControls?: boolean;
}

const PlayerInfo: FunctionComponent<Props> = ({state, hideHead, hideName, hideControls}) => {
    const {uniqueId, name, muted, deafened} = state;
    return <>
        <div className={"flex flex-row gap-2 items-center"}>
            {!hideHead &&
                <SpeakingOutline state={state} className={`rounded-md`}>
                    <Tooltip align={"top"} hint={<MinecraftComponent component={name}/>}>
                        <CraftHead className={"rounded-md w-12"} uuid={uniqueId}/>
                    </Tooltip>
                </SpeakingOutline>}
            {!hideName && <MinecraftComponent className={"text-xl"} component={name}/>}
            {!hideControls && (deafened ? <DeafenedIcon/> : muted ? <MutedIcon/> : <></>)}
        </div>
    </>;
};
export default PlayerInfo;
