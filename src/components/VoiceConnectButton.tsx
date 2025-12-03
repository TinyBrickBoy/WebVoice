import {useCallback, useEffect, useState} from "preact/hooks";
import type {FunctionComponent} from "preact";
import {useVoiceStateContext} from "./VoiceStateProvider.tsx";
import {VoiceSocket} from "../scripts/socket.ts";
import Button from "./Button.tsx";

const VoiceConnectButton: FunctionComponent = () => {
    const {socketUrl, socket: [socket, setSocket], state: [_state, setState]} = useVoiceStateContext();

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

    const openSocket = useCallback(() => {
        setConnecting(true);
        setState("disconnected");
        socket.close();

        setState("connecting");
        const newSocket = new VoiceSocket(socketUrl);
        newSocket.open();
        setSocket(newSocket);
    }, [socket, socketUrl]);

    return <>
        <Button
            color={"purple"}
            disabled={connecting || connected}
            onClick={openSocket}
            className={"grow"}
        >
            Connect
        </Button>
    </>;
};
export default VoiceConnectButton;
