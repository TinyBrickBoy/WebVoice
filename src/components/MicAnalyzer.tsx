import type {FunctionComponent} from "preact";
import {useEffect, useRef} from "preact/hooks";
import {SAMPLE_RATE} from "../scripts/audio/audio_constants.ts";
import {useVoiceStateContext} from "./VoiceStateProvider.tsx";
import {setupMicrophonePipeline} from "../scripts/audio/audio_mic.ts";

const MicAnalyzer: FunctionComponent = () => {
    const {socket: [socket], controls, devices, volumes, microphone} = useVoiceStateContext();

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
            frameId = requestAnimationFrame(draw);

            const bufferLength = preNoiseAnalyzer.frequencyBinCount;
            const preNoiseData = new Uint8Array(bufferLength);
            preNoiseAnalyzer.getByteFrequencyData(preNoiseData);
            const postNoiseData = new Uint8Array(bufferLength);
            postNoiseAnalyzer.getByteFrequencyData(postNoiseData);
            const postGateData = new Uint8Array(bufferLength);
            postGateAnalyzer.getByteFrequencyData(postGateData);

            const ctx = canvas.getContext("2d")!!;
            ctx.fillStyle = "black";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const barWidth = canvas.width / bufferLength;
            for (let i = 0; i < bufferLength; ++i) {
                const startHeight = preNoiseData[i];
                const rnnoiseHeight = postNoiseData[i];
                const noiseGateHeight = postGateData[i];
                ctx.fillStyle = "#f00";
                ctx.fillRect(i * barWidth, canvas.height - startHeight, barWidth + 1, startHeight - rnnoiseHeight);
                ctx.fillStyle = "#0f0";
                ctx.fillRect(i * barWidth, canvas.height - rnnoiseHeight, barWidth + 1, rnnoiseHeight - noiseGateHeight);
                ctx.fillStyle = "#fff";
                ctx.fillRect(i * barWidth, canvas.height - noiseGateHeight, barWidth + 1, noiseGateHeight);
            }
        };
        draw();

        return () => {
            teardown = true;
            if (frameId !== undefined) {
                cancelAnimationFrame(frameId!!);
            }
        };
    }, [canvasRef, microphone]);

    useEffect(() => {
        microphone.createContext(true);
        return () => microphone.destroyContext();
    }, [microphone]);

    return <>
        <canvas
            className={"w-full rounded-md h-1"}
            ref={canvasRef}
        />
    </>;
};
export default MicAnalyzer;
