import type {FunctionComponent} from "preact";
import Button from "./Button.tsx";
import SettingsIcon from "~icons/tabler/settings";
import {useState} from "preact/hooks";
import SettingsModal from "./SettingsModal.tsx";

const SettingsButton: FunctionComponent = () => {
    const [settingsVisible, setSettingsVisible] = useState<boolean>(false);

    return <>
        <SettingsModal visible={[settingsVisible, setSettingsVisible]}/>
        <Button color={"transparent"} className={"h-full"} onClick={() => setSettingsVisible(true)}>
            <SettingsIcon aria-label={"Settings"} stroke-width={2} className={"h-full w-auto"}/>
        </Button>
    </>;
};

export default SettingsButton;
