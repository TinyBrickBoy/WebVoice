import type {FunctionComponent} from "preact";
import CraftHead from "../common/CraftHead.tsx";
import {useVoiceStateContext} from "../VoiceStateProvider.tsx";
import SettingsButton from "../settings/SettingsButton.tsx";
import ControlPanel from "../settings/ControlPanel.tsx";

const Footer: FunctionComponent = () => {
    const {user: [user]} = useVoiceStateContext();

    return <>
        <div className={"flex flex-row justify-center gap-2 mt-2 w-1/4"}>
            <CraftHead className={"rounded-lg"} uuid={user.uuid} size={48}/>
            <div className={"h-full flex flex-row"}>
                <ControlPanel/>
                <SettingsButton/>
            </div>
        </div>
    </>;
};
export default Footer;
