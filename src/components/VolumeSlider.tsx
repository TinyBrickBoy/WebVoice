import {useEffect, useState} from "preact/hooks";
import type {FunctionComponent} from "preact";
import Slider from "./Slider.tsx";
import type {VolumeType} from "../scripts/audio/volumes.ts";
import {useVoiceStateContext} from "./VoiceStateProvider.tsx";

interface Props {
    type: VolumeType;
    name: string;
}

const VolumeSlider: FunctionComponent<Props> = ({type, name}) => {
    const {volumes} = useVoiceStateContext();

    const [volumeSlider, setVolumeSlider] = useState<number>(() => volumes.get(type, name) * 100);
    useEffect(() => volumes.set(type, name, volumeSlider / 100, false), [volumeSlider, volumes]);

    return <>
        <Slider
            max={100} min={0} step={0.25} value={volumeSlider}
            onChange={value => setVolumeSlider(value)} // don't save
            onSave={() => volumes.set(type, name, volumeSlider / 100)} // save
        >
            {volumeSlider.toFixed(0)}%
        </Slider>
    </>;
};
export default VolumeSlider;
