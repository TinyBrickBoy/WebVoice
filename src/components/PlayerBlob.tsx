import type {PlayerState} from "../scripts/types.ts";
import type {FunctionComponent, JSX} from "preact";
import CraftHead from "./CraftHead.tsx";
import type {UUID} from "../scripts/util/uuid.ts";
import {useEffect, useState} from "preact/hooks";
import {rgbToHex, type Vec3} from "@vibrant/color";

interface Props {
    state: PlayerState;
}

type PaletteResponse = { error: string } | {
    [name: string]: { rgb: Vec3; population: number } | undefined,
}

const fetchColor = async (uuid: UUID) => {
    const resp = await fetch(`/head/${uuid.name}/palette`);
    const palette = await resp.json() as PaletteResponse;
    if ("error" in palette) {
        throw new Error(`Failed to fetch color for ${uuid}: ${palette.error}`);
    }
    // get vibrant color from palette
    const color = palette["Vibrant"];
    if (!color) {
        throw new Error(`Unexpected server response for ${uuid}: ${JSON.stringify(palette)}`);
    }
    return rgbToHex(color.rgb[0], color.rgb[1], color.rgb[2]);
};

const PlayerBlob: FunctionComponent<Props> = ({state}) => {
    const [color, setColor] = useState<JSX.CSSProperties["background-color"]>("var(--color-neutral-800)");

    useEffect(() => {
        fetchColor(state.uniqueId)
            .then(color => setColor(color))
            .catch(error => console.error(error));
    }, [state]);

    return <>
        <div
            style={{backgroundColor: color}}
            className={"flex justify-center items-center p-6 rounded-lg"}
        >
            <CraftHead uuid={state.uniqueId} size={64}/>
        </div>
    </>;
};

export default PlayerBlob;
