import type {FunctionComponent} from "preact";
import MicrophoneIcon from "~icons/tabler/microphone";
import MicrophoneOffIcon from "~icons/tabler/microphone-off";
import HeadphonesIcon from "~icons/tabler/headphones";
import HeadphonesOffIcon from "~icons/tabler/headphones-off";
import WaveformIcon from "~icons/ph/waveform-bold";
import WaveformOffIcon from "~icons/ph/waveform-slash-bold";
import Button from "./Button.tsx";
import {useVoiceStateContext} from "./VoiceStateProvider.tsx";
import {useEffect, useState} from "preact/hooks";

const ControlPanel: FunctionComponent = () => {
    const {controls} = useVoiceStateContext();

    const [_refresh, setRefresh] = useState<number>(0);
    useEffect(() => {
        const handler = () => setRefresh(i => i + 1);
        return controls.registers()
            .register("update_muted", handler)
            .register("update_deafened", handler)
            .register("update_noise_reduction", handler)
            .callback();
    }, [controls]);

    return <>
        <Button color={"transparent"} onClick={() => controls.muted = !controls.muted}>
            {controls.muted ?
                <MicrophoneOffIcon aria-label={"Microphone Off"} stroke-width={2} className={"h-full w-auto"}/> :
                <MicrophoneIcon aria-label={"Microphone On"} stroke-width={2} className={"h-full w-auto"}/>
            }
        </Button>
        <Button color={"transparent"} onClick={() => controls.deafened = !controls.deafened}>
            {controls.deafened ?
                <HeadphonesOffIcon aria-label={"Speaker Off"} stroke-width={2} className={"h-full w-auto"}/> :
                <HeadphonesIcon aria-label={"Speaker On"} stroke-width={2} className={"h-full w-auto"}/>
            }
        </Button>
        <Button color={"transparent"} onClick={() => controls.noiseReduction = !controls.noiseReduction}>
            {controls.noiseReduction ?
                <WaveformIcon aria-label={"Noise Reduction On"} className={"h-full w-auto"}/> :
                <WaveformOffIcon aria-label={"Noise Reduction Off"} className={"h-full w-auto"}/>
            }
        </Button>
    </>;
};

export default ControlPanel;
