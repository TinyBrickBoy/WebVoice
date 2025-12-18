import type {FunctionComponent} from "preact";
import Modal from "../common/Modal.tsx";
import type {StateType} from "../../scripts/types.ts";
import VersionInfo from "./VersionInfo.tsx";
import DeviceSelectionDropdown from "./DeviceSelectionDropdown.tsx";
import VolumeSlider from "../common/VolumeSlider.tsx";
import Input from "../common/Input.tsx";
import MicAnalyzer from "../MicAnalyzer.tsx";
import {useVoiceStateContext} from "../VoiceStateProvider.tsx";

interface Props {
    visible: StateType<boolean>;
}

const SettingsModal: FunctionComponent<Props> = ({visible}) => {
    const {microphone} = useVoiceStateContext();

    return <>
        <Modal visible={visible} dismissable title={<>Settings</>}>
            <div className={"flex flex-col gap-3"}>
                <h3 className={"text-lg font-semibold"}>Input Settings</h3>
                <Input label={<>Input Device</>}>
                    <DeviceSelectionDropdown type={"input"}/>
                </Input>
                <Input label={<>Input Volume</>}>
                    <VolumeSlider type={"input"} name={""}/>
                </Input>
                {microphone.hasContext() && <MicAnalyzer/>}
                <h3 className={"text-lg font-semibold"}>Output Settings</h3>
                <Input label={<>Output Device</>}>
                    <DeviceSelectionDropdown type={"output"}/>
                </Input>
                <Input label={<>Output Volume</>}>
                    <VolumeSlider type={"output"} name={""}/>
                </Input>
                <VersionInfo/>
            </div>
        </Modal>
    </>;
};

export default SettingsModal;
