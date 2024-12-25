import {getVolume, setVolume, type VolumeType} from "../scripts/volumes.ts";
import {useEffect, useRef} from "preact/hooks";

interface Props {
    type: VolumeType;
    name: string;
    onUpdate?: (volume: number) => void;
}

const VolumeSlider = (props: Props) => {
    const volume = getVolume(props.type, props.name);
    const volumeRef = useRef<HTMLSpanElement>();

    useEffect(() => {
        if (props.onUpdate) {
            props.onUpdate(volume);
        }
    }, [props.type, props.name, props.onUpdate]);

    return (
        <div style={{display: "flex", flexDirection: "column"}}>
            { /* @ts-ignore null apparently isn't undefined... thanks JS */}
            <label for={props.name}>Volume: <span ref={volumeRef}>{volume}</span>%</label>
            <input
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
        </div>
    );
};
export default VolumeSlider;