import {useCallback, useState} from "preact/hooks";
import {VoiceSocket} from "../scripts/socket.ts";

interface Props {
    setSocket: (socket?: VoiceSocket) => void,
}

const VoiceConnectButton = (props: Props) => {
    const [connected, setConnected] = useState(false);
    const [connecting, setConnecting] = useState(false);

    const tryConnect = useCallback(() => {
        setConnecting(true);

        const socket = new VoiceSocket();
        socket.register("open", () => {
            console.error("OPENED")
            setConnected(true);
            setConnecting(false);
        });
        socket.register("close", () => {
            console.log("CLOSED")
            setConnected(false)
        })
        socket.register("error", () => {
            console.log("ERRORED")
        })
        console.log("FIRE")
        props.setSocket(socket);
    }, [])

    return <button disabled={connecting || connected} onClick={tryConnect}>Verbinden</button>
}
export default VoiceConnectButton;