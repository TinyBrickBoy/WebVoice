import type {ComponentChildren, FunctionComponent} from "preact";

interface Props {
    label: ComponentChildren;
}

const Input: FunctionComponent<Props> = ({label, children}) => {
    return <>
        <label className={"flex flex-col"}>
            <div className={"text-sm text-neutral-400 mb-1"}>
                {label}
            </div>
            {children}
        </label>
    </>;
};

export default Input;
