import {useCallback, useEffect, useState} from "preact/hooks";
import {VoiceSocket} from "../scripts/socket.ts";
import type {FunctionComponent} from "preact";

interface Props {
    socket: VoiceSocket;
    openSocket: () => void,
}

const VoiceConnectButton: FunctionComponent<Props> = ({socket, openSocket}) => {
    const [connected, setConnected] = useState(false);
    const [connecting, setConnecting] = useState(false);

    useEffect(() => {
        return socket.registers()
            .register("open", () => {
                setConnected(true);
                setConnecting(false);
            })
            .register("close", () => setConnected(false))
            .callback();
    }, [socket]);

    const tryConnect = useCallback(() => {
        setConnecting(true);
        openSocket();
    }, [openSocket]);

    return (
        <div>
            <button disabled={connecting || connected} onClick={tryConnect}>Connect</button>
        </div>
    );
};
export default VoiceConnectButton;
