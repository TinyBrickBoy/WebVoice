import type {FunctionComponent} from "preact";
import {useVoiceStateContext} from "../VoiceStateProvider.tsx";
import SettingsButton from "../settings/SettingsButton.tsx";
import ControlPanel from "../settings/ControlPanel.tsx";
import PlayerInfo from "../players/PlayerInfo.tsx";

const Footer: FunctionComponent = () => {
    const {user: [user], players: [players]} = useVoiceStateContext();
    const state = players[user.uniqueId.name];

    return <>
        <div className={"flex flex-row justify-center gap-2 mt-2 w-1/4"}>
            <PlayerInfo state={state ?? {...user, speaking: false}} hideName/>
            <div className={"h-full flex flex-row"}>
                <ControlPanel/>
                <SettingsButton/>
            </div>
        </div>
    </>;
};
export default Footer;
