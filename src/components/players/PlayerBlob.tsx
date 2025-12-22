import type {PlayerState} from "../../scripts/types.ts";
import type {FunctionComponent, JSX} from "preact";
import CraftHead from "../common/CraftHead.tsx";
import type {UUID} from "../../scripts/util/uuid.ts";
import {useEffect, useState} from "preact/hooks";
import {useAbortSignal} from "../../scripts/util/hooks.ts";
import MinecraftComponent from "../common/MinecraftComponent.tsx";
import MutedIcon from "../icons/MutedIcon.tsx";
import DeafenedIcon from "../icons/DeafenedIcon.tsx";

interface Props {
    state: PlayerState;
}

type ColorResponse = { error: string } | { color: number }

const fetchColor = async (uuid: UUID, abort: AbortSignal) => {
    const resp = await fetch(`/head/${uuid.name}/color`, {signal: abort});
    const respBody = await resp.json() as ColorResponse;
    if ("error" in respBody) {
        throw new Error(`Failed to fetch color for ${uuid}: ${respBody.error}`);
    }
    const rgbColor = respBody.color;
    return `#${rgbColor.toString(16).padStart(6, "0")}`;
};

const PlayerBlob: FunctionComponent<Props> = ({state: {uniqueId, speaking, name, muted, deafened}}) => {
    const [color, setColor] = useState<JSX.CSSProperties["background-color"]>("var(--color-neutral-800)");

    const abort = useAbortSignal([uniqueId]);
    useEffect(() => {
        fetchColor(uniqueId, abort)
            .then(color => setColor(color))
            .catch(error => console.error(error));
    }, [abort]);

    return <>
        <div
            style={{backgroundColor: color}}
            className={`group relative flex justify-center h-32 items-center p-6 rounded-lg m-[0.2rem] ${speaking ? "outline-emerald-500 outline-[0.2rem]" : ""}`}
        >
            <CraftHead uuid={uniqueId} className={"w-18"}/>
            <div
                className={`absolute bottom-0 left-0 m-1 bg-neutral-800/70 leading-none rounded-sm p-[7px] h-6.5 flex-row gap-1.5 text-sm items-center ${(muted || deafened) ? "flex" : "hidden group-hover:flex"}`}
            >
                {deafened ? <DeafenedIcon noHover/> : muted ? <MutedIcon noHover/> : <></>}
                <MinecraftComponent component={name} className={"hidden group-hover:flex select-none"}/>
            </div>
        </div>
    </>;
};

export default PlayerBlob;
