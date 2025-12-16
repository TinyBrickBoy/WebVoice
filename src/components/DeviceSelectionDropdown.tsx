import type {FunctionComponent} from "preact";
import {useVoiceStateContext} from "./VoiceStateProvider.tsx";
import {useCallback, useEffect, useState} from "preact/hooks";
import Dropdown from "./Dropdown.tsx";

interface Props {
    type: "input" | "output";
}

const DeviceSelectionDropdown: FunctionComponent<Props> = ({type}) => {
    const {devices} = useVoiceStateContext();

    const [deviceList, setDeviceList] = useState<MediaDeviceInfo[]>([]);
    const refreshDeviceList = useCallback(() => {
        const devicesPromise = devices[type === "input" ? "getMicrophoneList" : "getSpeakerList"]();
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

    const [deviceId, setDeviceId] = useState<string | null>(null);
    const refreshDeviceId = useCallback(() => {
        setDeviceId(devices[type === "input" ? "getMicrophoneId" : "getSpeakerId"]());
    }, [devices, type]);
    useEffect(() => {
        // initial refresh
        refreshDeviceId();
        // refresh when the device manager tells us to
        return devices.getEvents().register(
            type === "input" ? "update_microphone" : "update_speaker",
            () => refreshDeviceId(),
        );
    }, [devices, refreshDeviceId]);

    const [updating, setUpdating] = useState<boolean>(false);
    const updateDevice = useCallback((newDeviceId: string) => {
        setUpdating(true);
        devices[type === "input" ? "updateMicrophone" : "updateSpeaker"](newDeviceId)
            .then(result => {
                setUpdating(false);
                if (result) {
                    console.log(`Updated ${type} to ${newDeviceId}`);
                } else {
                    console.error(`Failed to update ${type} to ${newDeviceId}`);
                }
            })
            .catch(error => {
                setUpdating(false);
                console.error(`Error on audio change for ${type} to ${newDeviceId}`, error);
            });
    }, [devices, type]);

    if (type === "output" && !("setSinkId" in AudioContext.prototype)) {
        return <>
            <Dropdown disabled value={"empty"} className={"italic"}>
                <option value={"empty"}>Unsupported by Browser</option>
            </Dropdown>
        </>;
    }
    if (deviceList.length < 1) {
        return <>
            <Dropdown disabled value={"empty"} className={"italic"}>
                <option value={"empty"}>No devices found</option>
            </Dropdown>
        </>;
    }
    return <>
        <Dropdown
            value={deviceId || deviceList[0].deviceId} disabled={updating}
            onUpdate={value => updateDevice(value)}
        >
            {deviceList.map(device => (
                <option value={device.deviceId} key={device.deviceId}>{device.label}</option>
            ))}
        </Dropdown>
    </>;
};
export default DeviceSelectionDropdown;
