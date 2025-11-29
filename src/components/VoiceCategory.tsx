import VolumeSlider from "./VolumeSlider.tsx";
import type {AudioCategory} from "../scripts/types.ts";
import {renderComponent} from "../scripts/component.ts";

interface Props {
    category: AudioCategory;
}

const Category = (props: Props) => {
    const category = props.category;
    return (
        <div style={{display: "flex", flexDirection: "column", gap: "0.2em", marginTop: "1em"}}>
            <span>Category: {renderComponent(category.name)}</span>
            {category.description && <span>Description: {renderComponent(category.description)}</span>}
            <VolumeSlider type={"category"} name={props.category.uniqueId.name}/>
        </div>
    );
};
export default Category;
