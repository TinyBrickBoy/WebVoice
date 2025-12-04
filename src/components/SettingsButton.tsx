import type {FunctionComponent} from "preact";
import Button from "./Button.tsx";
import SettingsIcon from "~icons/tabler/settings";
import {useState} from "preact/hooks";
import SettingsModal from "./SettingsModal.tsx";

const SettingsButton: FunctionComponent = () => {
    const [settingsVisible, setSettingsVisible] = useState<boolean>(false);

    return <>
        <SettingsModal visible={[settingsVisible, setSettingsVisible]}/>
        <div className={"h-full"}>
            <Button color={"purple"} className={"h-full"} onClick={() => setSettingsVisible(true)}>
                <SettingsIcon aria-label={"Settings"} className={"h-full w-auto"}/>
            </Button>
        </div>
    </>;
};

export default SettingsButton;
