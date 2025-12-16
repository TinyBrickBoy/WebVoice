import type {FunctionComponent} from "preact";
import Modal from "./Modal.tsx";
import type {StateType} from "../scripts/types.ts";
import VersionInfo from "./VersionInfo.tsx";
import DeviceSelectionDropdown from "./DeviceSelectionDropdown.tsx";
import VolumeSlider from "./VolumeSlider.tsx";
import {useVoiceStateContext} from "./VoiceStateProvider.tsx";

interface Props {
    visible: StateType<boolean>;
}

const SettingsModal: FunctionComponent<Props> = ({visible}) => {
    const {devices} = useVoiceStateContext();

    return <>
        <Modal visible={visible} dismissable>
            <div className={"flex flex-col gap-1"}>
                <h2 className={"text-2xl font-bold"}>Settings</h2>
                <div className={"flex flex-col gap-3"}>
                    <h3 className={"text-lg font-semibold"}>Voice Settings</h3>
                    <label className={"flex flex-col gap-0.5"}>
                        <span>Input Device</span>
                        <DeviceSelectionDropdown type={"input"}/>
                    </label>
                    <label className={"flex flex-col gap-0.5"}>
                        <span>Input Volume</span>
                        <VolumeSlider type={"input"} name={""}/>
                    </label>
                    <label className={"flex flex-col gap-0.5"}>
                        <span>Output Device</span>
                        <DeviceSelectionDropdown type={"output"}/>
                    </label>
                    <label className={"flex flex-col gap-0.5"}>
                        <span>Output Volume</span>
                        <VolumeSlider type={"output"} name={""}/>
                    </label>
                </div>
                <VersionInfo/>
            </div>
        </Modal>
    </>;
};

export default SettingsModal;
