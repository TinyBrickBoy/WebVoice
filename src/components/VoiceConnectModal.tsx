import {useCallback, useEffect, useState} from "preact/hooks";
import type {FunctionComponent} from "preact";
import {useVoiceStateContext} from "./VoiceStateProvider.tsx";
import Button from "./common/Button.tsx";
import Modal from "./common/Modal.tsx";

interface Props {
    demo?: boolean;
}

const VoiceConnectModal: FunctionComponent<Props> = ({demo}) => {
    const {
        socketUrl,
        socket,
        state: [state, setState],
        devices,
        microphone,
    } = useVoiceStateContext();

    const [permissionState, setPermissionState] = useState<"checking" | "success" | "failed" | "todo">("todo");
    const checkPermissions = useCallback(async () => {
        setPermissionState("checking");
        try {
            const result = await devices.checkPermission();
            if (!result) {
                setPermissionState("success");
                await microphone.createContext();
                return true;
            }
            setPermissionState("failed");
            return false;
        } catch (error) {
            setPermissionState("failed");
            console.error(error);
            return false;
        }
    }, [devices]);

    const [visible, setVisible] = useState<boolean>(true);
    useEffect(() => setVisible(state !== "connected"), [state]);

    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        return socket.registers()
            .register("open", () => {
                setState("connected");
                setError(null);
            })
            .register("close", (event: CloseEvent) => {
                setState("disconnected");
                if (event.code !== 1000) {
                    setError(`closed (${event.code || -1}, ${event.reason || "unknown"})`);
                }
            })
            .callback();
    }, [socket]);

    const openSocket = useCallback(() => {
        if (demo) {
            setState("connected");
            setError(null);
            return;
        }
        socket.open();
        setState("connecting");
    }, [socket, socketUrl, demo]);

    const tryOpenSocket = useCallback(() => {
        if (permissionState === "todo") {
            checkPermissions()
                .then(result => !result || openSocket())
                .catch(error => console.error(error));
        } else if (permissionState === "success") {
            openSocket();
        }
    }, [permissionState, checkPermissions, openSocket]);

    return <>
        <Modal visible={[visible, setVisible]} dismissable={demo}>
            <div className={"flex flex-col"}>
                <div className={"flex p-3"}>
                    <Button
                        color={"purple"}
                        disabled={state !== "disconnected" || !permissionState}
                        onClick={tryOpenSocket}
                        className={"grow"}
                    >
                        Connect to Voice
                    </Button>
                </div>
                {permissionState === "checking" ?
                    <span className={"self-center"}>Checking permissions...</span>
                    : (permissionState === "failed" ?
                        <span className={"self-center"}>No voice input permissions!</span> : null)}
                {state === "connecting" && <span className={"self-center"}>
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
