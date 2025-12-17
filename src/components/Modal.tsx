import type {FunctionComponent} from "preact";
import {useCallback, useEffect} from "preact/hooks";
import XIcon from "~icons/tabler/x";
import type {StateType} from "../scripts/types.ts";

interface Props {
    visible: StateType<boolean>;
    dismissable?: boolean;
    onClose?: () => void;
}

const Modal: FunctionComponent<Props> = ({visible: [visible, setVisible], dismissable, onClose, children}) => {
    const doHide = useCallback(() => {
        setVisible(false);
        if (onClose) {
            onClose();
        }
    }, [onClose, setVisible]);

    useEffect(() => {
        if (!dismissable || !visible) {
            return;
        }
        const eventHandler = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                doHide();
            }
        };
        window.addEventListener("keydown", eventHandler);
        return () => window.removeEventListener("keydown", eventHandler);
    }, [dismissable, visible]);

    return !visible ? <></> : <>
        <dialog
            className={"fixed top-0 left-0 z-10 flex w-full h-full bg-[rgba(0,0,0,0.8)]"}
            onClick={event => event.stopPropagation()}
            onContextMenu={event => event.stopPropagation()}
            onMouseDown={event => {
                event.stopPropagation();
                if (dismissable && event.target === event.currentTarget) {
                    doHide();
                }
            }}
        >
            <div
                className={"relative flex flex-col w-full m-auto max-h-[90%] max-w-4/5 md:max-w-3/5 xl:max-w-2/5"}
            >
                <div className={"bg-neutral-800 p-4 rounded-lg shadow-md overflow-y-auto flex flex-col gap-2"}>
                    {dismissable &&
                        <div className={"text-white cursor-pointer opacity-70 hover:opacity-100"} onClick={doHide}>
                            <XIcon className={"h-7 w-auto"}/>
                        </div>
                    }
                    <div>
                        {children}
                    </div>
                </div>
            </div>
        </dialog>
    </>;
};

export default Modal;
