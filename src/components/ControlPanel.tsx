import type {FunctionComponent} from "preact";
import MicrophoneIcon from "~icons/tabler/microphone";
import MicrophoneOffIcon from "~icons/tabler/microphone-off";
import HeadphonesIcon from "~icons/tabler/headphones";
import HeadphonesOffIcon from "~icons/tabler/headphones-off";
import SineWaveIcon from "~icons/tabler/wave-sine";
import Button from "./Button.tsx";
import {useState} from "preact/hooks";

const ControlPanel: FunctionComponent = () => {
    const [muted, setMuted] = useState<boolean>(false);
    const [deafened, setDeafened] = useState<boolean>(false);
    const [noiseReduction, setNoiseReduction] = useState<boolean>(true);

    return <>
        <Button color={"transparent"} onClick={() => setMuted(!muted)}>
            {muted ?
                <MicrophoneOffIcon className={"h-full w-auto"}/> :
                <MicrophoneIcon className={"h-full w-auto"}/>
            }
        </Button>
        <Button color={"transparent"} onClick={() => setDeafened(!deafened)}>
            {deafened ?
                <HeadphonesOffIcon className={"h-full w-auto"}/> :
                <HeadphonesIcon className={"h-full w-auto"}/>
            }
        </Button>
        <Button color={"transparent"} onClick={() => setNoiseReduction(!noiseReduction)}>
            {noiseReduction ?
                <SineWaveIcon className={"h-full w-auto"}/> :
                <SineWaveIcon className={"h-full w-auto"}/>
            }
        </Button>
    </>;
};

export default ControlPanel;
