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
                    h-6 hover:h-6 rounded-full
                    duration-50
                    
                    [&::-webkit-slider-thumb]:duration-50
                    [&::-webkit-slider-thumb]:h-4
                    hover:[&::-webkit-slider-thumb]:h-4.5
                    [&::-webkit-slider-thumb]:w-4
                    hover:[&::-webkit-slider-thumb]:w-4.5
                    [&::-webkit-slider-thumb]:border-0
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:cursor-pointer
                    [&::-webkit-progress-value]:h-1
                    hover:[&::-webkit-progress-value]:h-1.5
                    [&::-webkit-progress-value]:rounded-full
                    [&::-webkit-progress-value]:bg-indigo-500
                    [&::-webkit-slider-runnable-track]:h-1
                    hover:[&::-webkit-slider-runnable-track]:h-1.5
                    [&::-webkit-slider-runnable-track]:bg-gray-500
                    [&::-webkit-slider-runnable-track]:rounded-full
                    
                    [&::-moz-range-thumb]:duration-50
                    [&::-moz-range-thumb]:h-4
                    hover:[&::-moz-range-thumb]:h-4.5
                    [&::-moz-range-thumb]:w-4
                    hover:[&::-moz-range-thumb]:w-4.5
                    [&::-moz-range-thumb]:border-0
                    [&::-moz-range-thumb]:rounded-full
                    [&::-moz-range-thumb]:cursor-pointer
                    [&::-moz-range-progress]:h-1
                    hover:[&::-moz-range-progress]:h-1.5
                    [&::-moz-range-progress]:rounded-full
                    [&::-moz-range-progress]:bg-indigo-500
                    [&::-moz-range-track]:h-1
                    hover:[&::-moz-range-track]:h-1.5
                    [&::-moz-range-track]:bg-gray-500
                    [&::-moz-range-track]:rounded-full
                `}
                onInput={({currentTarget: {value}}) => onChange(Number(value))}
                onChange={({currentTarget: {value}}) => !onSave || onSave(Number(value))}
            />
            <div className={"w-8 text-sm font-medium"}>{children}</div>
        </label>
    </>;
};
export default SliderInput;
