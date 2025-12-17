import type {FunctionComponent} from "preact";
import type {Dispatch} from "preact/hooks";
import TextBox from "../common/TextBox.tsx";
import Input from "../common/Input.tsx";

interface Props {
    setSearch: Dispatch<string>,
}

const SearchBar: FunctionComponent<Props> = ({setSearch}) => {
    return <>
        <Input label={<>Search</>}>
            <TextBox
                onChange={val => setSearch(val.trim().toLowerCase())}
                placeholder={"Enter search term"}
            />
        </Input>
    </>;
};

export default SearchBar;
