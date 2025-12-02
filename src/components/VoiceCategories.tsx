import Category from "./VoiceCategory.tsx";
import type {AudioCategory} from "../scripts/types.ts";
import type {FunctionComponent} from "preact";

interface Props {
    categories: AudioCategory[];
}

const VoiceCategories: FunctionComponent<Props> = ({categories}) => {
    return categories.length ?
        <>
            <h2 style={{marginBottom: "0"}}>Categories</h2>
            <div>
                {categories.map(category => (
                    <Category key={category.uniqueId.name} category={category}/>
                ))}
            </div>
        </> : <></>;
};
export default VoiceCategories;
