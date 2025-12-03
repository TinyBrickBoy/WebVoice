import type {FunctionComponent} from "preact";
import CraftHead from "./CraftHead.tsx";
import {useVoiceStateContext} from "./VoiceStateProvider.tsx";
import MinecraftComponent from "./MinecraftComponent.tsx";
import VoiceConnectButton from "./VoiceConnectButton.tsx";
import SettingsButton from "./SettingsButton.tsx";

export const UserProfile: FunctionComponent = () => {
    const {user: [user]} = useVoiceStateContext();

    return <>
        <div className={"flex flex-col gap-2 mt-2"}>
            <div className={"flex flex-row gap-2"}>
                <CraftHead uuid={user.uuid} size={48}/>
                <div className={"flex flex-col gap-1"}>
                    <MinecraftComponent component={user.name}/>
                    <span>SERVER INFO {/*TODO*/}</span>
                </div>
            </div>
            <div className={"flex flex-row gap-2"}>
                <VoiceConnectButton/>
                <SettingsButton/>
            </div>
        </div>
    </>;
};
