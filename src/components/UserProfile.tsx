import type {FunctionComponent} from "preact";
import CraftHead from "./CraftHead.tsx";
import {useVoiceStateContext} from "./VoiceStateProvider.tsx";
import SettingsButton from "./SettingsButton.tsx";
import ControlPanel from "./ControlPanel.tsx";

export const UserProfile: FunctionComponent = () => {
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
