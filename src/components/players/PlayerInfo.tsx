import CraftHead from "../common/CraftHead.tsx";
import VolumeSlider from "../common/VolumeSlider.tsx";
import type {PlayerState} from "../../scripts/types.ts";
import type {FunctionComponent} from "preact";

interface Props {
    state: PlayerState;
    inline?: boolean;
}

const PlayerInfo: FunctionComponent<Props> = ({state, inline}) => {
    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.2em",
            marginTop: !inline ? "1em" : undefined,
        }}>
            <div style={{display: "flex", gap: "0.4em", alignItems: "center"}}>
                <CraftHead uuid={state.uniqueId} size={24}/>
                <span>{state.name}{state.muted && " (muted)"}{state.deafened && (" (deafened)")}</span>
            </div>
            {!inline && <>
                <VolumeSlider type={"player"} name={state.uniqueId.name}/>
                {!!state.primaryRoomId && <span>Group: <code>{state.primaryRoomId.name}</code></span>}
            </>}
        </div>
    );
};
export default PlayerInfo;
