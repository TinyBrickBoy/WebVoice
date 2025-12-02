import {useCallback, useEffect, useState} from "preact/hooks";
import type {FunctionComponent} from "preact";
import {useVoiceStateContext} from "./VoiceStateProvider.tsx";

interface Props {
    openSocket: () => void,
}

const VoiceConnectButton: FunctionComponent<Props> = ({openSocket}) => {
    const {socket: [socket]} = useVoiceStateContext();

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
