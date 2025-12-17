import {type FunctionComponent, type JSX} from "preact";

interface Props extends Omit<JSX.InputHTMLAttributes<HTMLInputElement>, "onChange" | "onInput"> {
    onChange: (value: number) => void;
    onSave: (value: number) => void;
}

const Slider: FunctionComponent<Props> = ({onChange, onSave, className, children, ...other}) => {
    return <>
        <label className={"flex flex-row gap-4 items-center"}>
            <input
                {...other} type={"range"}
                className={`grow rounded-lg bg-neutral-500 accent-indigo-500 cursor-pointer ${className || ""}`}
                onInput={({currentTarget: {value}}) => onChange(Number(value))}
                onChange={({currentTarget: {value}}) => onSave(Number(value))}
            />
            <span className={"w-10"}>{children}</span>
        </label>
    </>;
};
export default Slider;
