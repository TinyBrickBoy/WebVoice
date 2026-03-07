import type {ComponentChildren, FunctionComponent, JSX} from "preact";
import {useCallback, useEffect, useRef, useState} from "preact/hooks";

interface Props extends Omit<JSX.HTMLAttributes, "onContextMenu"> {
    attributes?: Omit<JSX.HTMLAttributes, "style" | "ref">;
    content: ComponentChildren;
}

type Pos = ["left" | "right", number, "top" | "bottom", number] | null

const ContextMenu: FunctionComponent<Props> = ({className, children, attributes, content, ...other}) => {
    const [pos, setPos] = useState<Pos>(null);
    const contextRef = useRef<HTMLDivElement | null>(null);

    const onClick = useCallback((event: MouseEvent) => {
        if (!contextRef.current?.contains(event.target as Node)) {
            event.preventDefault();
            const width = window.innerWidth;
            const height = window.innerHeight;
            setPos([
                event.pageX < width / 2 ? "left" : "right",
                event.pageX < width / 2 ? event.pageX : width - event.pageX,
                event.pageY < height / 2 ? "top" : "bottom",
                event.pageY < height / 2 ? event.pageY : height - event.pageY,
            ]);
        }
    }, []);

    useEffect(() => {
        if (!pos) {
            return;
        }
        const handler = (event: MouseEvent) => {
            if (!contextRef.current?.contains(event.target as Node)) {
                event.preventDefault();
                setPos(null);
            }
        };
        window.addEventListener("click", handler);
        window.addEventListener("contextmenu", handler);
        return () => {
            window.removeEventListener("click", handler);
            window.removeEventListener("contextmenu", handler);
        };
    }, [pos]);

    return <>
        <div
            {...other}
            className={`cursor-pointer ${className || ""}`}
            onClick={onClick}
            onContextMenu={onClick}
        >
            {pos && <div
                {...(attributes ?? {})}
                ref={contextRef}
                style={{
                    [pos[0]]: `${pos[1]}px`,
                    [pos[2]]: `${pos[3]}px`,
                }}
                className={`cursor-auto border-neutral-800 border-2 fixed p-5 rounded-xl bg-neutral-900 z-10 ${attributes?.className || ""}`}
            >
                {content}
            </div>}
            {children}
        </div>
    </>;
};

export default ContextMenu;
