import CraftHead from "./CraftHead.tsx";
import VolumeSlider from "./VolumeSlider.tsx";
import type {UUID} from "../scripts/uuid.ts";

interface Props {
    playerId: UUID;
    name: string;
    disabled: boolean;
    disconnected: boolean;
    group?: string;
    inline?: boolean;
}

const PlayerInfo = (props: Props) => {
    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.2em",
            marginTop: !props.inline ? "1em" : undefined,
        }}>
            <div style={{display: "flex", gap: "0.4em", alignItems: "center"}}>
                <CraftHead uuid={props.playerId} size={24}/>
                <span>{props.name}{props.disabled && " (disabled)"}{props.disconnected && (" (disconnected)")}</span>
            </div>
            {!props.inline && <>
                <VolumeSlider type={"player"} name={props.playerId.name}/>
                {!!props.group && <span>Group: <code>{props.group}</code></span>}
            </>}
        </div>
    );
};
export default PlayerInfo;