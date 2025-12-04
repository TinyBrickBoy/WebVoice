import VolumeSlider from "./VolumeSlider.tsx";
import type {AudioCategory} from "../scripts/types.ts";
import MinecraftComponent from "./MinecraftComponent.tsx";
import type {FunctionComponent} from "preact";

interface Props {
    category: AudioCategory;
}

const VoiceCategory: FunctionComponent<Props> = ({category}) => {
    return (
        <div className={"flex flex-col gap-2 mt-2 bg-neutral-700 p-5 rounded-lg"}>
            <div className={"flex gap-2 items-center"}>
                <MinecraftComponent component={category.name}/>
                {category.description &&
                    <MinecraftComponent
                        className={"text-sm text-neutral-400"}
                        component={category.description}
                    />}
            </div>
            <VolumeSlider type={"category"} name={category.uniqueId.name}/>
        </div>
    );
};
export default VoiceCategory;
