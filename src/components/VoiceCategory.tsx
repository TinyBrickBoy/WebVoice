import VolumeSlider from "./VolumeSlider.tsx";
import type {AudioCategory} from "../scripts/types.ts";
import MinecraftComponent from "./MinecraftComponent.tsx";
import type {FunctionComponent} from "preact";

interface Props {
    category: AudioCategory;
}

const VoiceCategory: FunctionComponent<Props> = ({category}) => {
    return (
        <div className={"flex flex-col gap-1 mt-2 bg-neutral-700 p-6 rounded-lg"}>
            <div className={"flex gap-2 items-center"}>
                <span><MinecraftComponent component={category.name}/></span>
                {category.description && <span className={"text-sm text-neutral-400"}><MinecraftComponent component={category.description}/></span>}
            </div>
            <VolumeSlider type={"category"} name={category.uniqueId.name}/>
        </div>
    );
};
export default VoiceCategory;
