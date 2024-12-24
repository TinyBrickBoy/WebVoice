import {getVolume, setVolume, type VolumeType} from "../scripts/volumes.ts";
import {useRef} from "preact/hooks";

interface Props {
    type: VolumeType;
    name: string;
}

const VolumeSlider = (props: Props) => {
    const volume = getVolume(props.type, props.name);
    const volumeRef = useRef<HTMLSpanElement>();
    return (
        <div style={{display: "flex", flexDirection: "column"}}>
            { /* @ts-ignore null apparently isn't undefined... thanks JS */}
            <label for={props.name}>Volume: <span ref={volumeRef}>{volume}</span>%</label>
            <input
                id={props.name} type={"range"} max={100} min={0} step={1} value={volume}
                onInput={event => {
                    // instantly update displayed value, without saving
                    volumeRef.current!!.innerText = event.currentTarget.value;
                    setVolume(props.type, props.name, +event.currentTarget.value, false);
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