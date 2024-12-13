import VolumeSlider from "./VolumeSlider.tsx";

interface Props {
    name: string;
    description: string;
    volume: number;
    setVolume: (volume: number) => void;
}

const Category = (props: Props) => {
    return (
        <div style={{display: "flex", flexDirection: "column", gap: "0.2em", marginTop: "1em"}}>
            <span>Category: {props.name}</span>
            <span>Description: {props.description}</span>
            <VolumeSlider {...props}/>
        </div>
    );
};
export default Category;