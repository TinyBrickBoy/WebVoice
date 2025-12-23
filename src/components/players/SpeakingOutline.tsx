import type {FunctionComponent, JSX} from "preact";
import type {PlayerState} from "../../scripts/types.ts";
import {useEffect, useRef} from "preact/hooks";

type State = Pick<PlayerState, "speaking" | "register">

interface Props extends JSX.HTMLAttributes {
    state: State;
}

const SpeakingOutline: FunctionComponent<Props> = ({state, className, children, ...other}) => {
    const ref = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        return state.register("speak", ({detail: speaking}: CustomEvent<boolean>) => {
            const target = ref.current;
            if (target) {
                target.classList[speaking ? "add" : "remove"]("outline-[0.2rem]");
            }
        });
    }, [state]);

    return <>
        <div
            {...other}
            ref={ref}
            className={`m-[0.2rem] outline-emerald-500 ${state.speaking ? "outline-[0.2rem]" : ""} ${className || ""}`}
        >
            {children}
        </div>
    </>;
};

export default SpeakingOutline;
