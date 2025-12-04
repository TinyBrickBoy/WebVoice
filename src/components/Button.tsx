import type {FunctionComponent, JSX} from "preact";

export type ButtonColor = "purple"

interface Props extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
    color: ButtonColor;
}

const colors: Record<ButtonColor, JSX.HTMLAttributes["className"]> = {
    "purple": "bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-800",
};

const Button: FunctionComponent<Props> = ({color, className, children, ...other}) => {
    const cssColor = colors[color];
    return <>
        <button
            {...other}
            className={`p-1 ${className || ""} ${cssColor} not-disabled:cursor-pointer rounded-lg`}
        >
            {children}
        </button>
    </>;
};

export default Button;
