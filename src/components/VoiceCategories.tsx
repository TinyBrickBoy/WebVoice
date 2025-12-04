import VoiceCategory from "./VoiceCategory.tsx";
import type {FunctionComponent} from "preact";
import {useEffect} from "preact/hooks";
import {CategoryAddPacket, CategoryRemovePacket} from "../scripts/network/packets.ts";
import {useVoiceStateContext} from "./VoiceStateProvider.tsx";
import {AudioCategory} from "../scripts/types.ts";
import {randomUUID} from "../scripts/util/uuid.ts";

const VoiceCategories: FunctionComponent = () => {
    const {socket: [socket], categories: [categories, setCategories]} = useVoiceStateContext();

    useEffect(() => {
        setCategories({}); // invalidate

        // TODO remove debug
        const dcategories = {} as Record<string, AudioCategory>;
        for (let i = 0; i < 4; i++) {
            const uuid = randomUUID();
            dcategories[uuid.name] = new AudioCategory(uuid, `Category ${i}`, i % 2 == 0 ? `Epic Description ${i}` : null);
        }
        setCategories(dcategories);

        // register events
        return socket.registers()
            .register("open", () => setCategories({})) // TODO remove debug
            .register("category_add", ({detail: {category}}: CustomEvent<CategoryAddPacket>) => {
                setCategories(categories => {
                    // keep volume and copy categories record
                    category.volume = categories[category.uniqueId.name]?.volume || 1;
                    return {...categories, [category.uniqueId.name]: category};
                });
            })
            .register("category_remove", ({detail: {categoryId}}: CustomEvent<CategoryRemovePacket>) => {
                setCategories(categories => {
                    const newCategories = {...categories}; // copy record
                    delete newCategories[categoryId.name];
                    return newCategories;
                });
            })
            .callback();
    }, [socket]);

    const categoryValues = Object.values(categories);
    return <>
        <details open={true}>
            <summary className={"text-sm text-neutral-400"}>Categories ({categoryValues.length})</summary>
            <div className={"flex flex-col"}>
                {categoryValues.map(category => (
                    <VoiceCategory key={category.uniqueId.name} category={category}/>
                ))}
            </div>
        </details>
    </>;
};
export default VoiceCategories;
