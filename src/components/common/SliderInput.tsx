import {type FunctionComponent, type JSX} from "preact";

interface Props extends Omit<JSX.InputHTMLAttributes<HTMLInputElement>, "onChange" | "onInput"> {
    onChange: (value: number) => void;
    onSave?: (value: number) => void;
}

const SliderInput: FunctionComponent<Props> = ({onChange, onSave, className, children, ...other}) => {
    return <>
        <label className={"flex flex-row gap-4 items-center"}>
            <input
                {...other} type={"range"}
                className={`
                    grow cursor-pointer ${className || ""}
                    bg-indigo-500 accent-indigo-700
                    h-1 hover:h-1.5 rounded-full
                    duration-100
                    
                    [&::-webkit-slider-thumb]:h-4
                    hover:[&::-webkit-slider-thumb]:h-4.5
                    [&::-webkit-slider-thumb]:w-4
                    hover:[&::-webkit-slider-thumb]:w-4.5
                    [&::-webkit-slider-thumb]:border-0
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-white
                    [&::-webkit-slider-thumb]:cursor-pointer
                    [&::-webkit-slider-thumb]:duration-100
                    
                    [&::-moz-range-thumb]:h-4
                    hover:[&::-moz-range-thumb]:h-4.5
                    [&::-moz-range-thumb]:w-4
                    hover:[&::-moz-range-thumb]:w-4.5
                    [&::-moz-range-thumb]:border-0
                    [&::-moz-range-thumb]:rounded-full
                    [&::-moz-range-thumb]:bg-white
                    [&::-moz-range-thumb]:cursor-pointer
                    [&::-moz-range-thumb]:duration-100
                `}
                onInput={({currentTarget: {value}}) => onChange(Number(value))}
                onChange={({currentTarget: {value}}) => !onSave || onSave(Number(value))}
            />
            <div className={"w-8 text-sm font-medium"}>{children}</div>
        </label>
    </>;
};
export default SliderInput;
