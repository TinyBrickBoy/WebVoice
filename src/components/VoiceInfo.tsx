import MinecraftComponent from "./MinecraftComponent.tsx";
import type {FunctionComponent} from "preact";
import {useVoiceStateContext} from "./VoiceStateProvider.tsx";

interface Props {
    token: string,
    socketUrl: URL,
    state: string,
}

const VoiceInfo: FunctionComponent<Props> = ({token, socketUrl, state}) => {
    const {user: [user]} = useVoiceStateContext();

    return (
        <>
            <h2>Status</h2>
            <div style={{display: "flex", flexDirection: "column", gap: "0.2em"}}>
                <span>Player: {user ? <><MinecraftComponent
                    component={user.name}/> ({user.uuid.name})</> : <>Unknown</>}</span>
                <span>Token: <code>{token}</code></span>
                <span>Socket: <code>{socketUrl.toString()}</code></span>
                <span style={{textTransform: "capitalize"}}>{state}</span>
            </div>
        </>
    );
};
export default VoiceInfo;
