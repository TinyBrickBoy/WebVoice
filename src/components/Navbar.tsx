import type {FunctionComponent} from "preact";
import VoiceCategories from "./VoiceCategories.tsx";
import PlayerInfos from "./PlayerInfos.tsx";
import ClientGroups from "./ClientGroups.tsx";
import {UserProfile} from "./UserProfile.tsx";
import SearchBar from "./SearchBar.tsx";

export const Navbar: FunctionComponent = () => {
    return <>
        <div className={"flex flex-col min-w-110 p-4 gap-2 h-full bg-amber-950"}>
            <SearchBar/>
            <div className={"flex flex-col flex-1 gap-2 overflow-y-scroll grow"}>
                <VoiceCategories/>
                <PlayerInfos/>
                <ClientGroups/>
            </div>
            <div className={""}>
                <UserProfile/>
            </div>
        </div>
    </>;
};
