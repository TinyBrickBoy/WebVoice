import type {ComponentChildren, FunctionComponent, JSX} from "preact";

type Alignment = "top" | "bottom";

interface Props extends JSX.SelectHTMLAttributes<HTMLDivElement> {
    hint?: ComponentChildren;
    align: Alignment;
}

const Tooltip: FunctionComponent<Props> = ({hint, align, children, className, ...other}) => {
    return <>
        <div {...other} className={`group/hinfo relative flex flex-col ${className || ""}`}>
            {hint && <div
                aria-hidden={true}
                className={`self-center opacity-0 group-hover/hinfo:opacity-100 group-hover/hinfo:z-10 transition-opacity duration-100 absolute bg-neutral-800 leading-none mb-1 mt-1 p-2 select-none rounded-lg ${align === "top" ? "bottom-full" : "top-full"} whitespace-nowrap`}
            >
                {hint}
            </div>}
            {children}
        </div>
    </>;
};

export default Tooltip;
