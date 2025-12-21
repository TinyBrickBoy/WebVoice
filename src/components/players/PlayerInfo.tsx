import CraftHead from "../common/CraftHead.tsx";
import type {PlayerState} from "../../scripts/types.ts";
import type {FunctionComponent} from "preact";
import MinecraftComponent from "../common/MinecraftComponent.tsx";
import MicrophoneOffIcon from "~icons/tabler/microphone-off";
import HeadphonesOffIcon from "~icons/tabler/headphones-off";

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
                    <CraftHead className={"rounded-md"} uuid={uniqueId} size={48}/>
                </div>}
            {!hideName && <MinecraftComponent className={"text-xl"} component={name}/>}
            {!hideControls && <>
                {muted && <MicrophoneOffIcon aria-label={"Muted"} stroke-width={2} className={"h-full w-auto"}/>}
                {deafened && <HeadphonesOffIcon aria-label={"Deafened"} stroke-width={2} className={"h-full w-auto"}/>}
            </>}
        </div>
    </>;
};
export default PlayerInfo;
