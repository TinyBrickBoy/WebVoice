import type {FunctionComponent} from "preact";
import Modal from "./Modal.tsx";
import type {StateType} from "../scripts/types.ts";
import {useCallback, useEffect, useState} from "preact/hooks";
import {useVoiceStateContext} from "./VoiceStateProvider.tsx";
import Dropdown from "./Dropdown.tsx";
import VersionInfo from "./VersionInfo.tsx";

interface Props {
    visible: StateType<boolean>;
}

interface DropdownProps {
    type: "input" | "output";
}

const DeviceSelectionDropdown: FunctionComponent<DropdownProps> = ({type}) => {
    const {devices} = useVoiceStateContext();

    const [deviceList, setDeviceList] = useState<MediaDeviceInfo[]>([]);
    const [deviceId, setDeviceId] = useState<string | null>(null);

    const refreshDeviceList = useCallback(() => {
        const devicesPromise = devices[type === "input" ? "getMicrophoneList" : "getSpeakerList"].call(devices);
        devicesPromise
            .then(result => setDeviceList(result))
            .catch(error => console.error(error));
    }, [devices, type]);

    useEffect(() => {
        // initial refresh
        refreshDeviceList();
        // refresh when the device manager tells us to
        return devices.getEvents().register(
            "update_device_list",
            () => refreshDeviceList(),
        );
    }, [devices, refreshDeviceList]);

    const [updating, setUpdating] = useState<boolean>(false);
    const updateDevice = useCallback((newDeviceId: string) => {
        setUpdating(true);
        devices[type === "input" ? "updateMicrophone" : "updateSpeaker"](newDeviceId)
            .then(result => {
                setUpdating(false);
                if (result) {
                    setDeviceId(newDeviceId);
                } else {
                    console.error(`Failed to update ${type} to ${newDeviceId}`);
                }
            })
            .catch(error => {
                setUpdating(false);
                console.error("audio change", type, newDeviceId, error);
            });
    }, [devices, type]);


    if (deviceList.length < 1) {
        return <>
            <Dropdown disabled value={"empty"}>
                <option value={"empty"} className={"italic"}>No devices found</option>
            </Dropdown>
        </>;
    }
    return <>
        <Dropdown
            value={deviceId || deviceList[0].deviceId} disabled={updating}
            onChange={event => updateDevice(event.currentTarget.value)}
        >
            {deviceList.map(device => (
                <option value={device.deviceId} key={device.deviceId}>{device.label}</option>
            ))}
        </Dropdown>
    </>;
};

const SettingsModal: FunctionComponent<Props> = ({visible}) => {

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
                        <span>Output Device</span>
                        <DeviceSelectionDropdown type={"output"}/>
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
