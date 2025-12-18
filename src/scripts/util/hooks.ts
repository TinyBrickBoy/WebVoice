import {useEffect, useState} from "preact/hooks";

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
