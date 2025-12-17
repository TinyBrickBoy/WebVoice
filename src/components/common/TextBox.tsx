import type {FunctionComponent, JSX} from "preact";

interface Props extends Omit<JSX.InputHTMLAttributes<HTMLInputElement>, "onChange" | "onInput"> {
    onChange: (value: string) => void;
    onSave?: (value: string) => void;
}

const TextBox: FunctionComponent<Props> = ({onChange, onSave, className, ...other}) => {
    return <>
        <input
            {...other} type={"text"}
            className={`h-12 w-full p-4 rounded-xl text-sm bg-neutral-900 border border-neutral-700 placeholder:text-neutral-300 focus:outline-2 focus:outline-white disabled:cursor-not-allowed ${className || ""}`}
            onInput={event => onChange(event.currentTarget.value)}
            onChange={event => !onSave || onSave(event.currentTarget.value)}
        />
    </>;
};

export default TextBox;
