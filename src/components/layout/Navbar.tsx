import type {FunctionComponent} from "preact";
import CategoryList from "../categories/CategoryList.tsx";
import RoomList from "../rooms/RoomList.tsx";
import SearchBar from "./SearchBar.tsx";
import {useVoiceStateContext} from "../VoiceStateProvider.tsx";
import {useMemo, useState} from "preact/hooks";
import MinecraftComponent from "../common/MinecraftComponent.tsx";

const Navbar: FunctionComponent = () => {
    const {user: [user], rooms: [rooms], players: [players]} = useVoiceStateContext();
    const [search, setSearch] = useState<string>("");

    // find out which room the viewer is in
    const room = useMemo(() => {
        const roomId = players[user.uuid.name]?.primaryRoomId;
        return roomId ? rooms[roomId.name] : null;
    }, [user, rooms, players]);

    return <>
        <div className={"flex flex-col p-8 pb-0 gap-2 h-full w-1/2"}>
            <div className={"flex flex-col mb-6 w-full items-end"}>
                <span className={"text-sm"}>Current group</span>
                {room ?
                    <MinecraftComponent className={"text-xl"} component={room.name}/> :
                    <span className={"text-xl text-neutral-400"}>Not in a group</span>
                }
            </div>
            <SearchBar setSearch={setSearch}/>
            <div className={"flex flex-col flex-1 gap-2 overflow-y-auto rounded-lg grow"}>
                <CategoryList search={search}/>
                <RoomList search={search}/>
            </div>
        </div>
    </>;
};

export default Navbar;
