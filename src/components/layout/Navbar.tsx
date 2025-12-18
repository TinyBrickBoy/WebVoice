import type {FunctionComponent} from "preact";
import CategoryList from "../categories/CategoryList.tsx";
import RoomList from "../rooms/RoomList.tsx";
import SearchBar from "./SearchBar.tsx";
import {useState} from "preact/hooks";

const Navbar: FunctionComponent = ({children}) => {
    const [search, setSearch] = useState<string>("");

    return <>
        <div className={"flex flex-col p-3 mg:p-8 pb-0 gap-2 h-full w-full"}>
            {children}
            <SearchBar setSearch={setSearch}/>
            <div className={"flex flex-col flex-1 gap-2 overflow-y-auto rounded-lg grow"}>
                <CategoryList search={search}/>
                <RoomList search={search}/>
            </div>
        </div>
    </>;
};

export default Navbar;
