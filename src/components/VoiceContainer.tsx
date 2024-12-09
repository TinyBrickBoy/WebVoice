import {useState} from "preact/hooks";
import VoiceInfo from "./VoiceInfo.tsx";
import VoiceConnectButton from "./VoiceConnectButton.tsx";
import {VoiceSocket} from "../scripts/socket.ts";

interface Props {
    token: string;
}

const VoiceContainer = (props: Props) => {
    const [player, setPlayer] = useState<string | undefined>();
    const [state, setState] = useState<string>("disconnected");
    const [socket, setSocket] = useState<VoiceSocket | undefined>();

    const openSocket = (socket?: VoiceSocket) => {
        if (socket) {
            setState("Connecting...")
            socket.register("open", () => setState("Connected"))
            socket.register("error", console.error);
            socket.register("close", (event: CloseEvent) => {
                console.error(`Websocket closed with ${event.code}: ${event.reason}`, event);
                setState(`Disconnected: ${event.reason} (${event.code})`)
            });

            socket.registerToken(props.token);
            socket.open();
        }
        setSocket(socket)
    }

    return <>
        <VoiceInfo player={player} token={props.token} state={state}/>
        <div>
            <VoiceConnectButton setSocket={openSocket}/>
        </div>
    </>
}
export default VoiceContainer;