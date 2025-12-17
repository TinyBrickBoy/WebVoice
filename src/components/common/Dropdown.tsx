import {type FunctionComponent, type JSX} from "preact";

interface Props extends Omit<JSX.SelectHTMLAttributes<HTMLSelectElement>, "onChange"> {
    onUpdate?: (value: string) => void;
}

const Dropdown: FunctionComponent<Props> = ({onUpdate, children, ...other}) => {
    return <>
        <select
            {...other}
            className={"w-full p-2 border border-neutral-600 rounded-lg bg-neutral-700 disabled:bg-neutral-800 not-disabled:cursor-pointer disabled:cursor-not-allowed"}
            onChange={event => !onUpdate || onUpdate(event.currentTarget.value)}
        >
            {children}
        </select>
    </>;
};

export default Dropdown;
