import {getVolume, setVolume, type VolumeType} from "../scripts/util/volumes.ts";
import {useEffect, useRef, useState} from "preact/hooks";
import type {FunctionComponent} from "preact";

interface Props {
    type: VolumeType;
    name: string;
    onUpdate?: (volume: number) => void;
}

const VolumeSlider: FunctionComponent<Props> = (props) => {
    const [volumeSlider, setVolumeSlider] = useState<number>(getVolume(props.type, props.name));

    useEffect(() => {
        if (props.onUpdate) {
            props.onUpdate(volumeSlider);
        }
        setVolume(props.type, props.name, volumeSlider, false);
    }, [volumeSlider, props.onUpdate]);

    return (
        <div className={"flex flex-row gap-4 items-center"}>
            <input
                className={"grow rounded-lg bg-neutral-500 accent-neutral-500 cursor-pointer"} id={props.name} type={"range"}
                max={100} min={0} step={1} value={volumeSlider}
                onInput={event => setVolumeSlider(+event.currentTarget.value)} // don't save
                onChange={() => setVolume(props.type, props.name, volumeSlider)} // save on release
            />
            <label className={"w-10"} for={props.name}>{volumeSlider}%</label>
        </div>
    );
};
export default VolumeSlider;
