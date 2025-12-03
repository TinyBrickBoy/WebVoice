import type {FunctionComponent} from "preact";

const SearchBar: FunctionComponent = () => {
    return <>
        <label>
            Search
            <input type={"text"} placeholder={"Enter search term"}/>
        </label>
    </>;
};

export default SearchBar;
