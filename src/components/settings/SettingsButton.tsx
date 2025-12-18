import type {FunctionComponent} from "preact";
import Button from "../common/Button.tsx";
import SettingsIcon from "~icons/tabler/settings";
import {useEffect, useState} from "preact/hooks";
import SettingsModal from "./SettingsModal.tsx";
import {useVoiceStateContext} from "../VoiceStateProvider.tsx";

const SettingsButton: FunctionComponent = () => {
    const {state: [state]} = useVoiceStateContext();
    const [settingsVisible, setSettingsVisible] = useState<boolean>(false);

    useEffect(() => {
        if (state !== "connected") {
            setSettingsVisible(false);
        }
    }, [state === "connected"]);

    return <>
        <SettingsModal visible={[settingsVisible, setSettingsVisible]}/>
        <Button color={"transparent"} className={"h-full"} onClick={() => setSettingsVisible(true)}>
            <SettingsIcon aria-label={"Settings"} stroke-width={2} className={"h-full w-auto"}/>
        </Button>
    </>;
};

export default SettingsButton;
