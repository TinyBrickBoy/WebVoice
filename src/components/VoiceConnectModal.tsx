import {useCallback, useEffect, useState} from "preact/hooks";
import type {FunctionComponent} from "preact";
import {useVoiceStateContext} from "./VoiceStateProvider.tsx";
import {VoiceSocket} from "../scripts/socket.ts";
import Button from "./Button.tsx";
import Modal from "./Modal.tsx";

const VoiceConnectModal: FunctionComponent = () => {
    const {socketUrl, socket: [socket, setSocket], state: [_state, setState]} = useVoiceStateContext();

    const [connected, setConnected] = useState<boolean>(false);
    const [connecting, setConnecting] = useState<boolean>(false);

    const [visible, setVisible] = useState<boolean>(true);
    useEffect(() => setVisible(!connected || connecting), [connected, connecting]);

    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        return socket.registers()
            .register("open", () => {
                setConnected(true);
                setConnecting(false);
                setError(null);
            })
            .register("close", (event: CloseEvent) => {
                setConnected(false);
                setConnecting(false);
                if (event.code !== 1000) {
                    setError(`closed (${event.code || -1}, ${event.reason || "unknown"})`);
                }
            })
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
        <Modal visible={[visible, setVisible]}>
            <div className={"flex flex-col"}>
                <div className={"flex p-3"}>
                    <Button
                        color={"purple"}
                        disabled={connecting || connected}
                        onClick={openSocket}
                        className={"grow"}
                    >
                        Connect to Voice
                    </Button>
                </div>
                {connecting && <span className={"self-center"}>
                    Connecting...
                </span>}
                {error && <span className={"self-center"}>
                    Received error: {error}
                </span>}
            </div>
        </Modal>
    </>;
};
export default VoiceConnectModal;
