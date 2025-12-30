import type {PlayerState} from "../../scripts/types.ts";
import type {FunctionComponent, JSX} from "preact";
import CraftHead from "../common/CraftHead.tsx";
import type {UUID} from "../../scripts/util/uuid.ts";
import {useEffect, useState} from "preact/hooks";
import {useAbortSignal} from "../../scripts/util/hooks.ts";
import MinecraftComponent from "../common/MinecraftComponent.tsx";
import MutedIcon from "../icons/MutedIcon.tsx";
import DeafenedIcon from "../icons/DeafenedIcon.tsx";
import SpeakingOutline from "./SpeakingOutline.tsx";
import ContextMenu from "../common/ContextMenu.tsx";
import VolumeSlider from "../common/VolumeSlider.tsx";
import Input from "../common/Input.tsx";
import {fixSha256} from "../../scripts/util/util.ts";

interface Props {
    state: PlayerState;
}

type ColorResponse = { error: string } | { color: number }

const fetchColor = async (textureHash: string | null, uuid: UUID, signal: AbortSignal) => {
    const resp = await fetch(`/head/${fixSha256(textureHash) ?? uuid}/color`, {signal});
    const respBody = await resp.json() as ColorResponse;
    if ("error" in respBody) {
        throw new Error(`Failed to fetch color for ${uuid}: ${respBody.error}`);
    }
    const rgbColor = respBody.color;
    return `#${rgbColor.toString(16).padStart(6, "0")}`;
};

const PlayerBlob: FunctionComponent<Props> = ({state}) => {
    const {uniqueId, name, textureHash, muted, deafened} = state;

    const [color, setColor] = useState<JSX.CSSProperties["background-color"]>("var(--color-neutral-800)");
    const signal = useAbortSignal([textureHash, uniqueId]);
    useEffect(() => {
        fetchColor(textureHash, uniqueId, signal)
            .then(color => setColor(color))
            .catch(error => console.error(error));
    }, [signal]);

    return <>
        <ContextMenu content={<>
            <div className={"flex flex-col"}>
                <MinecraftComponent className={"font-semibold text-lg mb-3"} component={state.name}/>
                <Input label={<span className={"font-medium text-white"}>Volume</span>}>
                    <VolumeSlider type={"player"} name={state.uniqueId.name}/>
                </Input>
            </div>
        </>}>
            <SpeakingOutline
                state={state}
                style={{backgroundColor: color}}
                className={`group relative flex justify-center h-32 items-center p-6 rounded-lg`}
            >
                <CraftHead textureHash={textureHash} uuid={uniqueId} className={"w-18"}/>
                <div
                    className={`absolute bottom-0 left-0 m-1 bg-neutral-800/70 leading-none rounded-sm p-[7px] h-6.5 flex-row gap-1.5 text-sm items-center ${(muted || deafened) ? "flex" : "hidden group-hover:flex"}`}
                >
                    {deafened ? <DeafenedIcon noHover/> : muted ? <MutedIcon noHover/> : <></>}
                    <MinecraftComponent component={name} className={"hidden group-hover:flex select-none"}/>
                </div>
            </SpeakingOutline>
        </ContextMenu>
    </>;
};

export default PlayerBlob;
