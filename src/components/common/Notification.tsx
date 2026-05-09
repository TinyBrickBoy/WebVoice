import type {ComponentChildren, FunctionComponent} from "preact";
import {useEffect} from "preact/hooks";

interface Props {
    message: string;
    type?: "error" | "success" | "info";
    onClose?: () => void;
    duration?: number;
}

const Notification: FunctionComponent<Props> = ({message, type = "error", onClose, duration = 5000}) => {
    useEffect(() => {
        if (duration && onClose) {
            const timer = setTimeout(onClose, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, onClose]);

    const bgColor = type === "error" ? "bg-red-950/80" : type === "success" ? "bg-green-950/80" : "bg-slate-900/80";
    const textColor = type === "error" ? "text-red-300" : type === "success" ? "text-green-300" : "text-white";

    return (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 ${bgColor} ${textColor} px-6 py-3 rounded-lg backdrop-blur-sm border border-white/10 animate-pulse`}>
            {message}
        </div>
    );
};

export default Notification;
