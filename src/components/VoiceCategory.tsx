import VolumeSlider from "./VolumeSlider.tsx";
import type {AudioCategory} from "../scripts/types.ts";
import MinecraftComponent from "./MinecraftComponent.tsx";

interface Props {
    category: AudioCategory;
}

const Category = (props: Props) => {
    const category = props.category;
    return (
        <div style={{display: "flex", flexDirection: "column", gap: "0.2em", marginTop: "1em"}}>
            <span>Category: <MinecraftComponent component={category.name}/></span>
            {category.description && <span>Description: <MinecraftComponent component={category.description}/></span>}
            <VolumeSlider type={"category"} name={props.category.uniqueId.name}/>
        </div>
    );
};
export default Category;
