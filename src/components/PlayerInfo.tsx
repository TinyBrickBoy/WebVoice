import CraftHead from "./CraftHead.tsx";
import VolumeSlider from "./VolumeSlider.tsx";
import type {PlayerState} from "../scripts/types.ts";

interface Props {
    state: PlayerState;
    inline?: boolean;
}

const PlayerInfo = (props: Props) => {
    const state = props.state;
    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.2em",
            marginTop: !props.inline ? "1em" : undefined,
        }}>
            <div style={{display: "flex", gap: "0.4em", alignItems: "center"}}>
                <CraftHead uuid={state.uniqueId} size={24}/>
                <span>{state.name}{state.muted && " (muted)"}{state.deafened && (" (deafened)")}</span>
            </div>
            {!props.inline && <>
                <VolumeSlider type={"player"} name={state.uniqueId.name}/>
                {!!state.primaryRoomId && <span>Group: <code>{state.primaryRoomId.name}</code></span>}
            </>}
        </div>
    );
};
export default PlayerInfo;
