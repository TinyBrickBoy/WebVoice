import type {FunctionComponent} from "preact";
import MicrophoneIcon from "~icons/tabler/microphone";
import MicrophoneOffIcon from "~icons/tabler/microphone-off";
import HeadphonesIcon from "~icons/tabler/headphones";
import HeadphonesOffIcon from "~icons/tabler/headphones-off";
import WaveformIcon from "~icons/ph/waveform-bold";
import WaveformOffIcon from "~icons/ph/waveform-slash-bold";
import Button from "./Button.tsx";
import {useState} from "preact/hooks";

const ControlPanel: FunctionComponent = () => {
    const [muted, setMuted] = useState<boolean>(false);
    const [deafened, setDeafened] = useState<boolean>(false);
    const [noiseReduction, setNoiseReduction] = useState<boolean>(true);

    return <>
        <Button color={"transparent"} onClick={() => setMuted(!muted)}>
            {muted ?
                <MicrophoneOffIcon aria-label={"Microphone Off"} stroke-width={2} className={"h-full w-auto"}/> :
                <MicrophoneIcon aria-label={"Microphone On"} stroke-width={2} className={"h-full w-auto"}/>
            }
        </Button>
        <Button color={"transparent"} onClick={() => setDeafened(!deafened)}>
            {deafened ?
                <HeadphonesOffIcon aria-label={"Speaker Off"} stroke-width={2} className={"h-full w-auto"}/> :
                <HeadphonesIcon aria-label={"Speaker On"} stroke-width={2} className={"h-full w-auto"}/>
            }
        </Button>
        <Button color={"transparent"} onClick={() => setNoiseReduction(!noiseReduction)}>
            {noiseReduction ?
                <WaveformIcon aria-label={"Noise Reduction On"} className={"h-full w-auto"}/> :
                <WaveformOffIcon aria-label={"Noise Reduction Off"} className={"h-full w-auto"}/>
            }
        </Button>
    </>;
};

export default ControlPanel;
