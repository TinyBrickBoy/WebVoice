import Category from "./VoiceCategory.tsx";
import type {AudioCategory} from "../scripts/types.ts";

interface Props {
    categories: AudioCategory[];
}

const VoiceCategories = (props: Props) => {
    return props.categories.length ?
        <>
            <h2 style={{marginBottom: "0"}}>Categories</h2>
            <div>
                {props.categories.map(category => (
                    <Category key={category.uniqueId.name} category={category}/>
                ))}
            </div>
        </> : <></>;
};
export default VoiceCategories;
