import {getVolume, setVolume, type VolumeType} from "../scripts/util/volumes.ts";
import {useEffect, useRef} from "preact/hooks";
import type {FunctionComponent} from "preact";

interface Props {
    type: VolumeType;
    name: string;
    onUpdate?: (volume: number) => void;
}

const VolumeSlider: FunctionComponent<Props> = (props) => {
    const volume = getVolume(props.type, props.name);
    const volumeRef = useRef<HTMLSpanElement>();

    useEffect(() => {
        if (props.onUpdate) {
            props.onUpdate(volume);
        }
    }, [props.type, props.name, props.onUpdate]);

    return (
        <div className={"flex flex-col"}>
            { /* @ts-ignore null apparently isn't undefined... thanks JS */}
            <span className={"mt-2 mb-1 text-sm text-neutral-500"}>Volume</span>
            <div className={"flex gap-5"}>
                <input
                    className={"w-full"}
                    id={props.name} type={"range"} max={100} min={0} step={1} value={volume}
                    onInput={event => {
                        // instantly update displayed value, without saving
                        const volume = +event.currentTarget.value;
                        volumeRef.current!!.innerText = `${volume}`;
                        setVolume(props.type, props.name, +volume, false);
                        if (props.onUpdate) props.onUpdate(volume);
                    }}
                    onChange={event => {
                        // only save once the mouse has been released
                        setVolume(props.type, props.name, +event.currentTarget.value);
                    }}
                />
                <label className={"min-w-10"} for={props.name}><span ref={volumeRef}>{volume}</span>%</label>
            </div>
        </div>
    );
};
export default VolumeSlider;
