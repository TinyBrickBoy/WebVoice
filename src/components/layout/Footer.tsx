import type {FunctionComponent} from "preact";
import {useVoiceStateContext} from "../VoiceStateProvider.tsx";
import SettingsButton from "../settings/SettingsButton.tsx";
import ControlPanel from "../settings/ControlPanel.tsx";
import PlayerInfo from "../players/PlayerInfo.tsx";
import {NOOP_REMOVAL_CALLBACK} from "../../scripts/util/events.ts";

const Footer: FunctionComponent = () => {
    const {user: [user], players: [players], controls} = useVoiceStateContext();
    const state = players[user.uniqueId.name];

    return <>
        <div className={"flex flex-row justify-center gap-2 mt-2 w-full"}>
            <PlayerInfo
                state={state ?? {
                    ...user,
                    textureHash: null,
                    speaking: false,
                    muted: controls.muted,
                    deafened: controls.deafened,
                    register: () => NOOP_REMOVAL_CALLBACK,
                }}
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
