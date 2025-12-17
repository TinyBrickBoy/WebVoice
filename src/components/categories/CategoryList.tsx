import CategoryInfo from "./CategoryInfo.tsx";
import type {FunctionComponent} from "preact";
import {useEffect, useMemo} from "preact/hooks";
import {CategoryAddPacket, CategoryRemovePacket} from "../../scripts/network/packets.ts";
import {useVoiceStateContext} from "../VoiceStateProvider.tsx";
import {includesTextLc} from "../../scripts/network/component.ts";

interface Props {
    search: string,
}

const CategoryList: FunctionComponent<Props> = ({search}) => {
    const {socket: [socket], categories: [categories, setCategories]} = useVoiceStateContext();

    useEffect(() => {
        if (!socket.isActive()) {
            setCategories({});
        }
        return socket.registers()
            .register("open", () => setCategories({}))
            .register("category_add", ({detail: {category}}: CustomEvent<CategoryAddPacket>) => {
                setCategories(categories => {
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

    const categoryValues = useMemo(() => {
        let list = Object.values(categories);
        if (search) {
            list = list.filter(category =>
                includesTextLc(category.name, search)
                || (category.description && includesTextLc(category.description, search))
                || category.uniqueId.name.includes(search));
        }
        return list;
    }, [categories, search]);
    return <>
        <details open={true}>
            <summary className={"text-sm text-neutral-400 cursor-pointer select-none"}>
                Categories ({categoryValues.length})
            </summary>
            <div className={"flex flex-col gap-3 m-2"}>
                {categoryValues.map(category => (
                    <CategoryInfo key={category.uniqueId.name} category={category}/>
                ))}
            </div>
        </details>
    </>;
};
export default CategoryList;
