import type {FunctionComponent} from "preact";

const SearchBar: FunctionComponent = () => {
    return <>
        <div className={"flex flex-col"}>
            <span className={"text-sm text-neutral-600 mb-2"}>Search</span>
            <input className={"h-12 w-full p-4 rounded-lg bg-neutral-800 border-neutral-500 border text-sm"} type={"text"} placeholder={"Enter search term"}/>
        </div>
    </>;
};

export default SearchBar;
