import type {FunctionComponent, JSX} from "preact";

export type ButtonColor = "purple" | "transparent"

interface Props extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
    color: ButtonColor;
}

const colors: Record<ButtonColor, JSX.HTMLAttributes["className"]> = {
    purple: "bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-800",
    transparent: "bg-transparent opacity-70 hover:opacity-100 disabled:opacity-50"
};

const Button: FunctionComponent<Props> = ({color, className, children, ...other}) => {
    const cssColor = colors[color];
    return <>
        <button
            {...other}
            className={`p-3 ${className || ""} ${cssColor} not-disabled:cursor-pointer disabled:cursor-not-allowed rounded-xl`}
        >
            {children}
        </button>
    </>;
};

export default Button;
