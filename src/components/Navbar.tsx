import type {FunctionComponent} from "preact";
import VoiceCategories from "./VoiceCategories.tsx";
import ClientGroups from "./ClientGroups.tsx";
import SearchBar from "./SearchBar.tsx";

export const Navbar: FunctionComponent = () => {
    return <>
        <div className={"flex flex-col p-8 gap-2 h-full w-1/2"}>
            <div className={"flex flex-col mb-6 w-full items-end"}>
                <span className={"text-sm"}>Current group</span>
                <span className={"text-xl"}>CURRENT GROUP NAME {/*TODO*/}</span>
            </div>
            <SearchBar/>
            <div className={"flex flex-col flex-1 gap-2 overflow-y-scroll rounded-lg grow"}>
                <VoiceCategories/>
                <ClientGroups/>
            </div>
        </div>
    </>;
};
