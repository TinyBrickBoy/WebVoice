import type {ComponentChildren, FunctionComponent, JSX} from "preact";
import {useCallback, useEffect, useRef, useState} from "preact/hooks";

interface Props extends Omit<JSX.HTMLAttributes, "onContextMenu"> {
    attributes?: Omit<JSX.HTMLAttributes, "style" | "ref">;
    content: ComponentChildren;
}

type Pos = [number, number] | null

const ContextMenu: FunctionComponent<Props> = ({children, attributes, content, ...other}) => {
    const [pos, setPos] = useState<Pos>(null);
    const contextRef = useRef<HTMLDivElement | null>(null);

    const onContextMenu = useCallback((event: MouseEvent) => {
        event.preventDefault();
        setPos([event.pageX, event.pageY]);
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
        return () => window.removeEventListener("click", handler);
    }, [pos]);

    return <>
        <div
            {...other}
            onContextMenu={onContextMenu}
        >
            {pos && <div
                {...(attributes ?? {})}
                ref={contextRef}
                style={{
                    left: `${pos[0]}px`,
                    top: `${pos[1]}px`,
                }}
                className={`border-neutral-800 border-2 fixed p-5 rounded-xl bg-neutral-900 z-10 ${attributes?.className || ""}`}
            >
                {content}
            </div>}
            {children}
        </div>
    </>;
};

export default ContextMenu;
