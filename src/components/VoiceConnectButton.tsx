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
            setConnected(true);
            setConnecting(false);
        });
        socket.register("close", () => setConnected(false))
        props.setSocket(socket);
    }, [])

    return <button disabled={connecting || connected} onClick={tryConnect}>Verbinden</button>
}
export default VoiceConnectButton;