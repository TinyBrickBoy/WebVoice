import type {FunctionComponent} from "preact";
import {useCallback, useEffect, useRef, useState} from "preact/hooks";

type DragData = {
    startX: number;
    boxWidth: number;
    leftWidth: number;
    updateWidth: (leftWidth: number) => void
}

interface Props {
    leftWidthMin: number;
    leftWidthMax: number;
}

const DraggableHandle: FunctionComponent<Props> = ({leftWidthMin, leftWidthMax}) => {
    const [drag, setDrag] = useState<DragData | null>(null);
    const handle = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!drag) {
            return;
        }

        const moveHandler = (event: MouseEvent) => {
            const deltaX = event.clientX - drag.startX;
            // calculate how much space the left pane takes up
            const leftWidth = (drag.leftWidth + deltaX) / drag.boxWidth;
            const limitedLeftWidth = Math.min(Math.max(leftWidth, leftWidthMin), leftWidthMax);
            drag.updateWidth(limitedLeftWidth);
        };
        const endHandler = () => setDrag(null);
        const selectHandler = (event: Event) => event.preventDefault();

        document.addEventListener("mousemove", moveHandler);
        document.addEventListener("mouseup", endHandler);
        document.addEventListener("selectstart", selectHandler);
        return () => {
            document.removeEventListener("mousemove", moveHandler);
            document.removeEventListener("mouseup", endHandler);
            document.removeEventListener("selectstart", selectHandler);
        };
    }, [drag]);

    const startHandler = useCallback((event: MouseEvent) => {
        const target = handle.current!!;
        const parent = target.parentElement as HTMLDivElement;
        const rightElement = target.previousElementSibling!! as HTMLElement;

        setDrag({
            startX: event.clientX,
            leftWidth: rightElement.clientWidth,
            boxWidth: parent.clientWidth,
            updateWidth: (leftWidth) => {
                rightElement.style.width = `${leftWidth * 100}%`;
            },
        });
    }, []);

    return <>
        <div
            className={"p-1 cursor-col-resize"}
            onMouseDown={event => startHandler(event)}
            ref={handle}
        >
            <div className={"bg-neutral-700 p-[1px] h-full"}/>
        </div>
    </>;
};

export default DraggableHandle;
