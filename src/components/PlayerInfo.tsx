import CraftHead from "./CraftHead.tsx";
import VolumeSlider from "./VolumeSlider.tsx";

interface Props {
    playerId: string;
    name: string;
    disabled: boolean;
    disconnected: boolean;
    volume: number;
    setVolume: (volume: number) => void;
}

const PlayerInfo = (props: Props) => {
    return (
        <div style={{display: "flex", flexDirection: "column", gap: "0.2em", marginTop: "1em"}}>
            <div style={{display: "flex", gap: "0.4em", alignItems: "center"}}>
                <CraftHead uuid={props.playerId} size={24}/>
                <span>{props.name}{props.disabled && " (disabled)"}{props.disconnected && (" (disconnected)")}</span>
            </div>
            <VolumeSlider {...props}/>
        </div>
    );
};
export default PlayerInfo;