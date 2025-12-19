import type {FunctionComponent} from "preact";
import MicrophoneIcon from "~icons/tabler/microphone";
import MicrophoneOffIcon from "~icons/tabler/microphone-off";
import HeadphonesIcon from "~icons/tabler/headphones";
import HeadphonesOffIcon from "~icons/tabler/headphones-off";
import WaveformIcon from "~icons/ph/waveform-bold";
import WaveformOffIcon from "~icons/ph/waveform-slash-bold";
import Button from "../common/Button.tsx";
import {useVoiceStateContext} from "../VoiceStateProvider.tsx";
import {useEffect, useState} from "preact/hooks";
import {StateInfoPacket} from "../../scripts/network/packets.ts";

const ControlPanel: FunctionComponent = () => {
    const {socket, controls} = useVoiceStateContext();

    const [_refresh, setRefresh] = useState<number>(0);
    useEffect(() => {
        const triggerRefresh = () => setRefresh(i => i + 1);
        const sendPacket = () => {
            socket.sendPacket(new StateInfoPacket(controls.muted, controls.deafened));
        };
        const controlsCallback = controls.registers()
            .register("update_muted", () => {
                triggerRefresh();
                sendPacket();
            })
            .register("update_deafened", () => {
                triggerRefresh();
                sendPacket();
            })
            .register("update_noise_reduction", triggerRefresh)
            .callback();
        // trigger packet sending on connected send
        const socketCallback = socket.register("connected", () => sendPacket());
        return () => {
            controlsCallback();
            socketCallback();
        };
    }, [socket, controls]);

    return <>
        <Button color={"transparent"} onClick={() => {
            controls.muted = !controls.muted || controls.deafened;
        }}>
            {controls.muted ?
                <MicrophoneOffIcon aria-label={"Microphone Off"} stroke-width={2} className={"h-full w-auto"}/> :
                <MicrophoneIcon aria-label={"Microphone On"} stroke-width={2} className={"h-full w-auto"}/>
            }
        </Button>
        <Button color={"transparent"} onClick={() => {
            if (controls.deafened) {
                controls.deafened = false;
            } else {
                controls.deafened = true;
                controls.muted = true;
            }
        }}>
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
