import {type EffectCallback, type Inputs, useEffect, useMemo, useRef, useState} from "preact/hooks";

// inspired by https://upmostly.com/tutorials/how-to-use-media-queries-in-react
export const useMediaQuery = (query: string) => {
    const [matches, setMatches] = useState<boolean>(false);

    useEffect(() => {
        const update = () => setMatches(window.matchMedia(query).matches);
        update(); // update on query change

        // listen for window resizing
        window.addEventListener("resize", update);
        return () => window.removeEventListener("resize", update);
    }, [query]);

    return matches;
};

// inspired by https://github.com/yairEO/react-hooks/tree/e956c9b85f4c366b26b78d7797652acd317b95c9/hooks/useAbortSignal
export const useAbortSignal = (inputs: Inputs | undefined) => {
    const controller = useMemo(() => new AbortController(), inputs);
    useEffect(() => (() => controller.abort()), [controller]);
    return controller.signal; // returns a boolean
};

// triggers once inputs get changed, without triggering on initial component mount
// inspired by https://stackoverflow.com/a/53180013
export const useUpdateEffect = (effect: EffectCallback, inputs?: Inputs) => {
    const isMounting = useRef<boolean>(false);
    useEffect(() => {
        isMounting.current = true;
    }, []);
    useEffect(() => {
        if (!isMounting.current) {
            return effect();
        } else {
            isMounting.current = false;
        }
    }, inputs);
};
