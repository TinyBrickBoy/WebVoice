import type {FunctionComponent} from "preact";
import Modal from "./Modal.tsx";
import type {StateType} from "../scripts/types.ts";
import {useCallback, useEffect, useState} from "preact/hooks";
import {useVoiceStateContext} from "./VoiceStateProvider.tsx";
import {DEFAULT_DEVICE_ID} from "../scripts/audio/audio_mic.ts";
import Dropdown from "./Dropdown.tsx";
import VersionInfo from "./VersionInfo.tsx";

interface Props {
    visible: StateType<boolean>;
}

const InputDeviceSelection: FunctionComponent<Props> = ({visible}) => {
    const {settings: [settings, setSettings]} = useVoiceStateContext();
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

    useEffect(() => {
        const timer = setTimeout(async () => {
            const foundDevices = await navigator.mediaDevices.enumerateDevices();
            const filteredDevices = foundDevices
                .filter(device => device.deviceId.length !== 0)
                .filter(device => device.kind === "audioinput");
            setDevices(filteredDevices);
        }, 500);
        return () => clearTimeout(timer);
    }, [visible]);

    const updateMic = useCallback((device: string) => {
        setSettings(data => ({...data, microphoneId: device}));
    }, []);

    if (devices.length < 1) {
        return <>
            <Dropdown disabled value={"nop"}>
                <option value={"nop"}>Loading devices...</option>
            </Dropdown>
        </>;
    }
    return <>
        <Dropdown
            value={settings.microphoneId}
            onChange={event => updateMic(event.currentTarget.value)}
        >
            <option value={DEFAULT_DEVICE_ID}>Default</option>
            {devices.map(device => (
                <option value={device.deviceId} key={device.deviceId}>{device.label}</option>
            ))}
        </Dropdown>
    </>;
};

const SettingsModal: FunctionComponent<Props> = ({visible}) => {
    const {settings: [settings, setSettings]} = useVoiceStateContext();

    return <>
        <Modal visible={visible} dismissable>
            <div className={"flex flex-col gap-1"}>
                <h2 className={"text-2xl font-bold"}>Settings</h2>
                <div className={"flex flex-col gap-3"}>
                    <h3 className={"text-lg font-semibold"}>Input Settings</h3>
                    <label className={"flex flex-col gap-0.5"}>
                        <span>Input Device</span>
                        <InputDeviceSelection visible={visible}/>
                    </label>
                    <label className={"flex flex-col"}>

                    </label>
                </div>
                <VersionInfo/>
            </div>
        </Modal>
    </>;
};

export default SettingsModal;
