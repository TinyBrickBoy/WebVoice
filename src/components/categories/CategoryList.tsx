import CategoryInfo from "./CategoryInfo.tsx";
import type {FunctionComponent} from "preact";
import {useEffect} from "preact/hooks";
import {CategoryAddPacket, CategoryRemovePacket} from "../../scripts/network/packets.ts";
import {useVoiceStateContext} from "../VoiceStateProvider.tsx";
import {CategoryState} from "../../scripts/types.ts";
import {randomUUID} from "../../scripts/util/uuid.ts";
import {includesTextLc} from "../../scripts/network/component.ts";

interface Props {
    search: string,
}

const CategoryList: FunctionComponent<Props> = ({search}) => {
    const {socket: [socket], categories: [categories, setCategories]} = useVoiceStateContext();

    useEffect(() => {
        setCategories({}); // invalidate

        // TODO remove debug
        const dcategories = {} as Record<string, CategoryState>;
        for (let i = 0; i < 4; i++) {
            const uuid = randomUUID();
            dcategories[uuid.name] = new CategoryState(uuid, `Category ${i}`, i % 2 == 0 ? `Epic Description ${i}` : null);
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

    let categoryValues = Object.values(categories);
    if (search) {
        categoryValues = categoryValues.filter(category =>
            includesTextLc(category.name, search)
            || (category.description && includesTextLc(category.description, search))
            || category.uniqueId.name.includes(search));
    }
    return <>
        <details open={true}>
            <summary className={"text-sm text-neutral-400 cursor-pointer select-none"}>Categories ({categoryValues.length})</summary>
            <div className={"flex flex-col"}>
                {categoryValues.map(category => (
                    <CategoryInfo key={category.uniqueId.name} category={category}/>
                ))}
            </div>
        </details>
    </>;
};
export default CategoryList;
