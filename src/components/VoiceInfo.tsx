interface Props {
    player?: string,
    token: string,
    state: string,
}

const VoiceInfo = (props: Props) => {
    return <>
        <span>Player: <code>{props.player || "Unknown"}</code></span>
        <span>Token: <code>{props.token}</code></span>
        <span style={{textTransform: "capitalize"}}>{props.state}</span>
    </>
}
export default VoiceInfo;