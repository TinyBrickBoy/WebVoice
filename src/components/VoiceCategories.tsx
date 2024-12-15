import type {VoiceCategory} from "./VoiceContainer.tsx";
import Category from "./VoiceCategory.tsx";

interface Props {
    categories: VoiceCategory[];
}

const VoiceCategories = (props: Props) => {
    return props.categories.length ?
        <>
            <h2 style={{marginBottom: "0"}}>Categories</h2>
            <div>
                {props.categories.map(category => (
                    <Category key={category.id} {...category} />
                ))}
            </div>
        </> : <></>;
};
export default VoiceCategories;