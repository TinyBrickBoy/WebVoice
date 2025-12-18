import type {FunctionComponent} from "preact";
import MinecraftComponent from "../common/MinecraftComponent.tsx";
import {useVoiceStateContext} from "../VoiceStateProvider.tsx";

const CurrentServer: FunctionComponent = () => {
    const {user: [{serverName}]} = useVoiceStateContext();
    return <>
        <div className={"flex flex-col w-full"}>
            <span className={"text-sm"}>Current server</span>
            <MinecraftComponent noColor className={"text-xl capitalize"} component={serverName || "none"}/>
        </div>
    </>;
};

export default CurrentServer;
