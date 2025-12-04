import type {FunctionComponent} from "preact";

const SearchBar: FunctionComponent = () => {
    return <>
        <label className={"flex flex-row gap-2"}>
            Search
            <input type={"text"} placeholder={"Enter search term"}/>
        </label>
    </>;
};

export default SearchBar;
