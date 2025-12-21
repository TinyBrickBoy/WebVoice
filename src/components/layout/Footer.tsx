import type {FunctionComponent} from "preact";
import {useVoiceStateContext} from "../VoiceStateProvider.tsx";
import SettingsButton from "../settings/SettingsButton.tsx";
import ControlPanel from "../settings/ControlPanel.tsx";
import PlayerInfo from "../players/PlayerInfo.tsx";

const Footer: FunctionComponent = () => {
    const {user: [user], players: [players], controls} = useVoiceStateContext();
    const state = players[user.uniqueId.name];

    return <>
        <div className={"flex flex-row justify-center gap-2 mt-2 w-1/4"}>
            <PlayerInfo
                state={state ?? {...user, speaking: false, muted: controls.muted, deafened: controls.deafened}}
                hideName hideControls
            />
            <div className={"h-full flex flex-row"}>
                <ControlPanel/>
                <SettingsButton/>
            </div>
        </div>
    </>;
};
export default Footer;
