import Category from "./VoiceCategory.tsx";
import type {AudioCategory} from "../scripts/types.ts";
import type {FunctionComponent} from "preact";
import {useEffect, useState} from "preact/hooks";
import {VoiceSocket} from "../scripts/socket.ts";
import {CategoryAddPacket, CategoryRemovePacket} from "../scripts/network/packets.ts";

interface Props {
    socket: VoiceSocket;
}

const VoiceCategories: FunctionComponent<Props> = ({socket}) => {
    const [categories, setCategories] = useState<Record<string, AudioCategory>>({});

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
