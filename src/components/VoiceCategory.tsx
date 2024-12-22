import VolumeSlider from "./VolumeSlider.tsx";

interface Props {
    id: string;
    name: string;
    description?: string;
}

const Category = (props: Props) => {
    return (
        <div style={{display: "flex", flexDirection: "column", gap: "0.2em", marginTop: "1em"}}>
            <span>Category: {props.name} / {props.id}</span>
            {props.description && <span>Description: {props.description}</span>}
            <VolumeSlider type={"category"} name={props.id}/>
        </div>
    );
};
export default Category;