import type {FunctionComponent} from "preact";
import VoiceCategories from "./VoiceCategories.tsx";
import PlayerInfos from "./PlayerInfos.tsx";
import ClientGroups from "./ClientGroups.tsx";
import {UserProfile} from "./UserProfile.tsx";
import SearchBar from "./SearchBar.tsx";

export const Navbar: FunctionComponent = () => {
    return <>
        <div className={"flex flex-col min-w-110 m-3 gap-2 h-full"}>
            <SearchBar/>
            <div className={"flex flex-col gap-2 overflow-y-scroll"}>
                <VoiceCategories/>
                <PlayerInfos/>
                <ClientGroups/>
            </div>
            <UserProfile/>
        </div>
    </>;
};
