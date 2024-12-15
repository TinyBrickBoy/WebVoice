import VolumeSlider from "./VolumeSlider.tsx";

interface Props {
    id: string;
    name: string;
    description?: string;
}

const Category = (props: Props) => {
    return (
        <div style={{display: "flex", flexDirection: "column", gap: "0.2em", marginTop: "1em"}}>
            <span>Category: {props.name}</span>
            {props.description && <span>Description: {props.description}</span>}
            <VolumeSlider type={"category"} name={props.name}/>
        </div>
    );
};
export default Category;