import type {ComponentChildren, FunctionComponent, JSX} from "preact";
import {useCallback, useEffect, useState} from "preact/hooks";

interface Props extends Omit<JSX.HTMLAttributes, "onContextMenu"> {
    contextAttributes?: Omit<JSX.HTMLAttributes, "style" | "ref">;
    contextContent: ComponentChildren;
}

type Pos = [number, number] | null

const PlayerContextMenu: FunctionComponent<Props> = ({children, contextAttributes, contextContent, ...other}) => {
    const [pos, setPos] = useState<Pos>(null);

    const onContextMenu = useCallback((event: MouseEvent) => {
        event.preventDefault();
        setPos([event.pageX, event.pageY]);
    }, []);

    useEffect(() => {
        if (!pos) {
            return;
        }
        const handler = () => setPos(null);
        window.addEventListener("click", handler);
        return () => window.removeEventListener("click", handler);
    }, [pos]);

    return <>
        <div
            {...other}
            onContextMenu={onContextMenu}
        >
            {pos && <div
                {...(contextAttributes ?? {})}
                style={{
                    left: `${pos[0]}px`,
                    top: `${pos[1]}px`,
                }}
                className={`border-neutral-700 border-2 fixed p-4 rounded-lg bg-neutral-800 z-10 ${contextAttributes?.className || ""}`}
            >
                {contextContent}
            </div>}
            {children}
        </div>
    </>;
};

export default PlayerContextMenu;
