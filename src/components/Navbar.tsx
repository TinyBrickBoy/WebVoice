import type {FunctionComponent} from "preact";
import VoiceCategories from "./VoiceCategories.tsx";
import PlayerInfos from "./PlayerInfos.tsx";
import ClientGroups from "./ClientGroups.tsx";
import {UserProfile} from "./UserProfile.tsx";
import SearchBar from "./SearchBar.tsx";

export const Navbar: FunctionComponent = () => {
    return <>
        <div className={"flex flex-col min-w-110 p-4 gap-2 h-full w-1/2 bg-neutral-900"}>
            <SearchBar/>
            <div className={"flex flex-col flex-1 gap-2 overflow-y-scroll grow"}>
                <VoiceCategories/>
                <ClientGroups/>
            </div>
        </div>
    </>;
};
