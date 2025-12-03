import type {FunctionComponent, JSX} from "preact";

export type ButtonColor = "purple"

interface Props extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
    color: ButtonColor;
}

const colors: Record<ButtonColor, JSX.CSSProperties["color"]> = {
    "purple": "#867aef", // TODO tailwind property?
};

const Button: FunctionComponent<Props> = ({color, className, children, ...other}) => {
    const cssColor = colors[color];
    return <>
        <button
            {...other}
            style={{backgroundColor: cssColor}}
            className={`p-1 ${className || ""}`}
        >
            {children}
        </button>
    </>;
};

export default Button;
