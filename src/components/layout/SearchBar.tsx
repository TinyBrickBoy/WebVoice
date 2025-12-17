import type {FunctionComponent} from "preact";
import type {Dispatch} from "preact/hooks";

interface Props {
    setSearch: Dispatch<string>,
}

const SearchBar: FunctionComponent<Props> = ({setSearch}) => {
    return <>
        <div className={"flex flex-col"}>
            <span className={"text-sm text-neutral-400 mb-2"}>Search</span>
            <input
                className={"h-12 w-full p-4 rounded-xl text-sm bg-neutral-900 border border-neutral-700 placeholder:text-neutral-300 focus:outline-2 focus:outline-white"}
                type={"text"} placeholder={"Enter search term"}
                onInput={event => setSearch(event.currentTarget.value.trim().toLowerCase())}
            />
        </div>
    </>;
};

export default SearchBar;
