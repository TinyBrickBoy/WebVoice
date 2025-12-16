import {getVolume, setVolume, type VolumeType} from "../scripts/util/volumes.ts";
import {useEffect, useState} from "preact/hooks";
import type {FunctionComponent} from "preact";
import Slider from "./Slider.tsx";

interface Props {
    type: VolumeType;
    name: string;
}

const VolumeSlider: FunctionComponent<Props> = ({type, name}) => {
    const [volumeSlider, setVolumeSlider] = useState<number>(() => getVolume(type, name));

    useEffect(() => {
        setVolume(type, name, volumeSlider, false);
    }, [volumeSlider]);

    return <>
        <Slider
            max={100} min={0} step={1} value={volumeSlider}
            onChange={value => setVolumeSlider(value)} // don't save
            onSave={() => setVolume(type, name, volumeSlider)} // save
        >
            {volumeSlider}%
        </Slider>
    </>;
};
export default VolumeSlider;
