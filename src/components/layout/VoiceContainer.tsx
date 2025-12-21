import {useEffect} from "preact/hooks";
import {ConnectedPacket} from "../../scripts/network/packets.ts";
import type {FunctionComponent} from "preact";
import {useVoiceStateContext} from "../VoiceStateProvider.tsx";
import Navbar from "./Navbar.tsx";
import PlayerGrid from "../players/PlayerGrid.tsx";
import Footer from "./Footer.tsx";
import VoiceConnectModal from "../VoiceConnectModal.tsx";
import DraggableHandle from "./DraggableHandle.tsx";
import {useMediaQuery} from "../../scripts/util/hooks.ts";
import CurrentRoom from "../rooms/CurrentRoom.tsx";
import CurrentServer from "../players/CurrentServer.tsx";

interface Props {
    socketUrl: URL;
}

const VoiceContainer: FunctionComponent<Props> = ({socketUrl}) => {
    const {
        socket,
        user: [_user, setUser],
        state: [_state, setState],
    } = useVoiceStateContext();

    useEffect(() => {
        // register events
        return socket.registers()
            .register("open", () => setState("connected"))
            .register("close", (event: CloseEvent) => {
                console.error(`Websocket closed with ${event.code}: ${event.reason}`, event);
                setState("disconnected");
            })
            .register("connected", ({detail: packet}: CustomEvent<ConnectedPacket>) => {
                // save player info
                setUser({
                    ...packet,
                    uniqueId: packet.playerId,
                    name: packet.username,
                });
            })
            .callback();
    }, [socket]);

    // TODO somehow use var(--breakpoint-mg)?
    const horizontal = useMediaQuery("(width >= 50rem)");

    return <>
        <main className={"flex flex-col h-full"}>
            <VoiceConnectModal demo={socketUrl.hostname === "example"}/>
            <div className={"flex grow overflow-y-auto mg:flex-row flex-col"}>
                <div className={`mg:w-1/2 xl:w-2/5 w-full${horizontal ? "" : "!"}`}>
                    <Navbar>
                        <div className={"flex flex-row justify-between w-full"}>
                            {!horizontal && <CurrentServer/>}
                            <CurrentRoom/>
                        </div>
                    </Navbar>
                </div>
                {horizontal && <DraggableHandle
                    leftWidthMin={0.25}
                    leftWidthMax={0.7}
                />}
                <PlayerGrid>
                    {horizontal && <CurrentServer/>}
                </PlayerGrid>
            </div>
            <div className={"flex flex-row justify-center p-3 border-t-2 border-solid border-neutral-700"}>
                <Footer/>
            </div>
        </main>
    </>;
};

export default VoiceContainer;
