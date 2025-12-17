import VolumeSlider from "../common/VolumeSlider.tsx";
import type {CategoryState} from "../../scripts/types.ts";
import MinecraftComponent from "../common/MinecraftComponent.tsx";
import type {FunctionComponent} from "preact";

interface Props {
    category: CategoryState;
}

const CategoryInfo: FunctionComponent<Props> = ({category}) => {
    return (
        <div className={"flex flex-col gap-2 mt-3 bg-neutral-900 p-5 rounded-xl"}>
            <div className={"flex gap-2 items-center"}>
                <MinecraftComponent
                    component={category.name}
                    className={"text-lg font-semibold"}
                />
                {category.description &&
                    <MinecraftComponent
                        className={"text-sm text-neutral-300"}
                        component={category.description}
                    />}
            </div>
            <VolumeSlider type={"category"} name={category.uniqueId.name}/>
        </div>
    );
};
export default CategoryInfo;
