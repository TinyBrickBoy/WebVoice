import type {ComponentChildren, FunctionComponent, JSX} from "preact";
import {useCallback, useEffect, useRef, useState} from "preact/hooks";

interface Props extends Omit<JSX.HTMLAttributes, "onContextMenu"> {
    attributes?: Omit<JSX.HTMLAttributes, "style" | "ref">;
    content: ComponentChildren;
}

type Pos = [number, number] | null

const ContextMenu: FunctionComponent<Props> = ({className, children, attributes, content, ...other}) => {
    const [pos, setPos] = useState<Pos>(null);
    const contextRef = useRef<HTMLDivElement | null>(null);

    const onClick = useCallback((event: MouseEvent) => {
        if (!contextRef.current?.contains(event.target as Node)) {
            event.preventDefault();
            setPos([event.pageX, event.pageY]);
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
                    left: `${pos[0]}px`,
                    top: `${pos[1]}px`,
                }}
                className={`cursor-auto border-neutral-700 border-2 fixed p-4 rounded-lg bg-neutral-800 z-10 ${attributes?.className || ""}`}
            >
                {content}
            </div>}
            {children}
        </div>
    </>;
};

export default ContextMenu;
