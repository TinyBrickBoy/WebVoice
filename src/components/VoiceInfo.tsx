import type {PlayerInfo} from "./VoiceContainer.tsx";

interface Props {
    player?: PlayerInfo,
    token: string,
    socket: URL,
    state: string,
}

const VoiceInfo = (props: Props) => {
    return (
        <>
            <h2>Status</h2>
            <div style={{display: "flex", flexDirection: "column", gap: "0.2em"}}>
                <span>Player: <code>{props.player ? `${props.player.name} (${props.player.uuid.name})` : "Unknown"}</code></span>
                <span>Token: <code>{props.token}</code></span>
                <span>Socket: <code>{props.socket.toString()}</code></span>
                <span style={{textTransform: "capitalize"}}>{props.state}</span>
            </div>
        </>
    );
};
export default VoiceInfo;