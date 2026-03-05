import type {FunctionComponent} from "preact";
import {useEffect, useMemo, useRef} from "preact/hooks";
import {useVoiceStateContext} from "./VoiceStateProvider.tsx";
import {ANALYZER_FREQ_BIN_COUNT} from "../scripts/audio/audio_mic.ts";

const MicAnalyzer: FunctionComponent = () => {
    const {microphone} = useVoiceStateContext();

    // inject analyzer nodes into audio graph while this component is visible
    useEffect(() => {
        microphone.injectAnalyzers();
        microphone.rebuildPipeline();
        return () => {
            microphone.uninjectAnalyzers();
            microphone.rebuildPipeline();
        };
    }, [microphone]);

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const preNoiseData = useMemo<Uint8Array>(() => new Uint8Array(ANALYZER_FREQ_BIN_COUNT), []);
    const postNoiseData = useMemo<Uint8Array>(() => new Uint8Array(ANALYZER_FREQ_BIN_COUNT), []);
    const postGateData = useMemo<Uint8Array>(() => new Uint8Array(ANALYZER_FREQ_BIN_COUNT), []);
    const finalData = useMemo<Uint8Array>(() => new Uint8Array(ANALYZER_FREQ_BIN_COUNT), []);

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

            const [startAnalyzer, rnnoiseAnalyzer, noiseGateAnalyzer, finalAnalyzer] = microphone.analyzers;

            // extract data from audio analyzer nodes
            startAnalyzer?.getByteFrequencyData(preNoiseData);
            rnnoiseAnalyzer?.getByteFrequencyData(postNoiseData);
            noiseGateAnalyzer?.getByteFrequencyData(postGateData);
            finalAnalyzer?.getByteFrequencyData(finalData);

            // create canvas drawing context
            const ctx = canvas.getContext("2d")!!;

            // draw black background
            ctx.fillStyle = "black";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // draw each bar
            const barWidth = canvas.width / ANALYZER_FREQ_BIN_COUNT;
            for (let i = 0; i < ANALYZER_FREQ_BIN_COUNT; ++i) {
                const startHeight = preNoiseData[i];
                const rnnoiseHeight = postNoiseData[i];
                const noiseGateHeight = postGateData[i];
                const finalHeight = finalData[i];
                // draw start bar in dark gray
                ctx.fillStyle = "#444";
                ctx.fillRect(
                    i * barWidth, canvas.height - startHeight,
                    barWidth + 1, startHeight - rnnoiseHeight,
                );
                // draw rnnoise bar in light gray
                ctx.fillStyle = "#aaa";
                ctx.fillRect(
                    i * barWidth, canvas.height - rnnoiseHeight,
                    barWidth + 1, rnnoiseHeight - noiseGateHeight,
                );
                // draw noise gate bar in white
                ctx.fillStyle = "#fff";
                ctx.fillRect(
                    i * barWidth, canvas.height - noiseGateHeight,
                    barWidth + 1, noiseGateHeight - finalHeight,
                );
                // draw final bar in white
                ctx.fillStyle = "#b273e6";
                ctx.fillRect(
                    i * barWidth, canvas.height - finalHeight,
                    barWidth + 1, finalHeight,
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
            className={"w-full rounded-md h-15"}
            ref={canvasRef}
        />
    </>;
};
export default MicAnalyzer;
