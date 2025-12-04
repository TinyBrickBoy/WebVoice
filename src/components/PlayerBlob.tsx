import type {PlayerState} from "../scripts/types.ts";
import type {FunctionComponent, JSX} from "preact";
import CraftHead from "./CraftHead.tsx";
import type {UUID} from "../scripts/util/uuid.ts";
import {useEffect, useState} from "preact/hooks";

interface Props {
    state: PlayerState;
}

type ColorResponse = { error: string } | { color: number }

const fetchColor = async (uuid: UUID) => {
    const resp = await fetch(`/head/${uuid.name}/color`);
    const respBody = await resp.json() as ColorResponse;
    if ("error" in respBody) {
        throw new Error(`Failed to fetch color for ${uuid}: ${respBody.error}`);
    }
    const rgbColor = respBody.color;
    return `#${rgbColor.toString(16).padStart(6, "0")}`;
};

const PlayerBlob: FunctionComponent<Props> = ({state}) => {
    const [color, setColor] = useState<JSX.CSSProperties["background-color"]>("var(--color-neutral-800)");

    useEffect(() => {
        fetchColor(state.uniqueId)
            .then(color => setColor(color))
            .catch(error => console.error(error));
    }, [state.uniqueId]);

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
