import Category from "./VoiceCategory.tsx";
import type {FunctionComponent} from "preact";
import {useEffect} from "preact/hooks";
import {CategoryAddPacket, CategoryRemovePacket} from "../scripts/network/packets.ts";
import {useVoiceStateContext} from "./VoiceStateProvider.tsx";

const VoiceCategories: FunctionComponent = () => {
    const {socket: [socket], categories: [categories, setCategories]} = useVoiceStateContext();

    useEffect(() => {
        setCategories({}); // invalidate

        // register events
        return socket.registers()
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

    return Object.values(categories).length ?
        <div className={"container"}>
            <h2 style={{marginBottom: "0"}}>Categories</h2>
            <div>
                {Object.values(categories).map(category => (
                    <Category key={category.uniqueId.name} category={category}/>
                ))}
            </div>
        </div> : <></>;
};
export default VoiceCategories;
