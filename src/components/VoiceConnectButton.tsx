import {useCallback, useEffect, useState} from "preact/hooks";
import {VoiceSocket} from "../scripts/socket.ts";

interface Props {
    socket: VoiceSocket;
    openSocket: () => void,
}

const VoiceConnectButton = (props: Props) => {
    const [connected, setConnected] = useState(false);
    const [connecting, setConnecting] = useState(false);

    useEffect(() => {
        return props.socket.registers()
            .register("open", () => {
                setConnected(true);
                setConnecting(false);
            })
            .register("close", () => setConnected(false))
            .callback();
    }, [props.socket]);

    const tryConnect = useCallback(() => {
        setConnecting(true);
        props.openSocket();
    }, [props.openSocket]);

    return (
        <div>
            <button disabled={connecting || connected} onClick={tryConnect}>Verbinden</button>
        </div>
    );
};
export default VoiceConnectButton;