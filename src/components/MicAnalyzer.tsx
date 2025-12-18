import type {FunctionComponent} from "preact";
import {useEffect, useRef} from "preact/hooks";
import {useVoiceStateContext} from "./VoiceStateProvider.tsx";
import {ANALYZER_FREQ_BIN_COUNT} from "../scripts/audio/audio_mic.ts";

const MicAnalyzer: FunctionComponent = () => {
    const {microphone} = useVoiceStateContext();

    // inject analyzer nodes into audio graph while this component is visible
    useEffect(() => {
        microphone.injectAnalyzers();
        return () => microphone.uninjectAnalyzers();
    }, [microphone]);

    const canvasRef = useRef<HTMLCanvasElement | null>(null);

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

            const [startAnalyzer, rnnoiseAnalyzer, noiseGateAnalyzer] = microphone.analyzers;

            // extract data from audio analyzer nodes
            const bufferLength = ANALYZER_FREQ_BIN_COUNT;
            const preNoiseData = new Uint8Array(bufferLength);
            startAnalyzer?.getByteFrequencyData(preNoiseData);
            const postNoiseData = new Uint8Array(bufferLength);
            rnnoiseAnalyzer?.getByteFrequencyData(postNoiseData);
            const postGateData = new Uint8Array(bufferLength);
            noiseGateAnalyzer?.getByteFrequencyData(postGateData);

            // create canvas drawing context
            const ctx = canvas.getContext("2d")!!;

            // draw black background
            ctx.fillStyle = "black";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // draw each bar
            const barWidth = canvas.width / bufferLength;
            for (let i = 0; i < bufferLength; ++i) {
                const startHeight = preNoiseData[i];
                const rnnoiseHeight = postNoiseData[i];
                const noiseGateHeight = postGateData[i];
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
                    barWidth + 1, noiseGateHeight,
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
