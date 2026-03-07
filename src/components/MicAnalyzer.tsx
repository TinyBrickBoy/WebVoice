import type {FunctionComponent} from "preact";
import {useEffect, useMemo, useRef} from "preact/hooks";
import {useVoiceStateContext} from "./VoiceStateProvider.tsx";
import {ANALYZER_FREQ_BIN_COUNT} from "../scripts/audio/audio_mic.ts";

const MicAnalyzer: FunctionComponent = () => {
    const {microphone} = useVoiceStateContext();

    // inject analyzer nodes into audio graph while this component is visible
    useEffect(() => {
        microphone.injectAnalyzer();
        microphone.rebuildPipeline();
        return () => {
            microphone.uninjectAnalyzers();
            microphone.rebuildPipeline();
        };
    }, [microphone]);

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const data = useMemo<Uint8Array>(() => new Uint8Array(ANALYZER_FREQ_BIN_COUNT), []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) {
            return;
        }

        let teardown = false;
        let frameId: number | null = null;
        const draw = () => {
            if (teardown) {
                return;
            }
            // immediately request drawing new animation frame
            frameId = requestAnimationFrame(draw);

            const analyzer = microphone.analyzer;

            // extract data from audio analyze node
            analyzer?.getByteFrequencyData(data);

            // create canvas drawing context
            const ctx = canvas.getContext("2d")!!;

            // clear background
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // draw each bar
            const barWidth = canvas.width / ANALYZER_FREQ_BIN_COUNT;
            for (let i = 0; i < ANALYZER_FREQ_BIN_COUNT; ++i) {
                const height = data[i];
                ctx.fillStyle = "#b273e6";
                ctx.fillRect(
                    i * barWidth, canvas.height - height,
                    barWidth + 1, height,
                );
            }
        };
        // draw first animation frame
        draw();

        return () => {
            teardown = true;
            // cancel animation frame drawing (if started)
            if (frameId !== undefined) {
                cancelAnimationFrame(frameId!!);
            }
        };
    }, [canvasRef, microphone]);

    return <>
        <canvas
            className={"w-full rounded-md h-15 bg-neutral-900 border border-neutral-700"}
            ref={canvasRef}
        />
    </>;
};
export default MicAnalyzer;
